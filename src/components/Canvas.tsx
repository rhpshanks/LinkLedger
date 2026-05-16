import { useMemo, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  Node,
  applyNodeChanges,
  NodeChange
} from '@xyflow/react';
import { useAppStore } from '../store';
import { CardNode } from './CardNode';
import { SubscriptionNode } from './SubscriptionNode';
import { differenceInDays } from 'date-fns';

const nodeTypes = {
  cardNode: CardNode,
  subNode: SubscriptionNode,
};

export function Canvas({ onSelectCard, onSelectSub, filterType }: { onSelectCard: (id: string) => void, onSelectSub: (id: string) => void, filterType: 'all' | 'alert' | 'soon' | 'high_cost' }) {
  const { cards, subscriptions, alertsPrefs, nodePositions, updateNodesPositions } = useAppStore();

  const filteredSubs = useMemo(() => {
    return subscriptions.filter(sub => {
      if (filterType === 'all') return !!1;
      const daysUntil = differenceInDays(new Date(sub.nextRenewalDate), new Date());
      if (filterType === 'alert') return daysUntil < 0;
      if (filterType === 'soon') return daysUntil <= 14;
      if (filterType === 'high_cost') return sub.amount > 50;
      return !!1;
    });
  }, [subscriptions, filterType]);

  const filteredCards = useMemo(() => {
    if (filterType === 'all') return cards;
    // We only show cards that have at least one sub that passed the filter, OR if the card itself is in alert state 
    // when looking at alerts.
    return cards.filter(card => {
      const cardSubs = filteredSubs.filter(s => s.cardId === card.id);
      if (cardSubs.length > 0) return !!1;
      
      if (filterType === 'alert') {
          const totalSpend = subscriptions.filter(s => s.cardId === card.id).reduce((acc, sub) => acc + (sub.cycle === 'monthly' ? sub.amount : sub.amount/3), 0);
          if (card.limit && totalSpend > card.limit) return !!1;
      }
      return !!0;
    });
  }, [cards, filteredSubs, subscriptions, filterType]);

  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];
    filteredCards.forEach((card, i) => {
      // Calculate spend
      const cardSubs = subscriptions.filter(s => s.cardId === card.id);
      const totalSpend = cardSubs.reduce((acc, sub) => {
        const factor = sub.cycle === 'monthly' ? 1 : sub.cycle === 'annual' ? 1/12 : 1/3;
        return acc + (sub.amount * factor);
      }, 0);
      const isAlert = card.limit ? totalSpend > card.limit : !!0;
      
      const pos = nodePositions[card.id] || { x: 50, y: i * 200 + 50 };

      nodes.push({
        id: card.id,
        type: 'cardNode',
        position: pos,
        data: { 
          ...card, 
          isAlert,
          onClick: () => onSelectCard(card.id)
        }
      });
    });

    filteredSubs.forEach((sub, i) => {
      const nextDate = new Date(sub.nextRenewalDate);
      const daysUntil = differenceInDays(nextDate, new Date());
      const isPastDue = daysUntil < 0;
      const isApproaching = daysUntil >= 0 && daysUntil <= alertsPrefs.advanceNoticeDays;
      
      const pos = nodePositions[sub.id] || { x: 400, y: i * 150 + 50 };

      nodes.push({
        id: sub.id,
        type: 'subNode',
        position: pos,
        data: {
          ...sub,
          isPastDue,
          isApproaching,
          onClick: () => onSelectSub(sub.id)
        }
      });
    });
    return nodes;
  }, [filteredCards, filteredSubs, subscriptions, alertsPrefs, nodePositions, onSelectCard, onSelectSub]);

  const initialEdges = useMemo(() => {
    return filteredSubs
      .filter(s => s.cardId)
      .map(s => {
        const nextDate = new Date(s.nextRenewalDate);
        const daysUntil = differenceInDays(nextDate, new Date());
        let stroke = '#334155'; // default dark gray
        if (daysUntil < 0) stroke = '#ef4444'; // red-500
        else if (daysUntil <= alertsPrefs.advanceNoticeDays) stroke = '#f59e0b'; // amber-500

        return {
          id: `e-${s.cardId}-${s.id}`,
          source: s.cardId!,
          target: s.id,
          style: { stroke, strokeWidth: daysUntil <= alertsPrefs.advanceNoticeDays ? 2 : 1 },
          animated: daysUntil <= alertsPrefs.advanceNoticeDays,
        };
      });
  }, [subscriptions, alertsPrefs]);

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Sync state back
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const onNodesChangeHandler = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        // Save positions if dragging stopped
        const posChanges = updated.filter(n => changes.some(c => c.type === 'position' && c.id === n.id && c.dragging === !!0));
        if (posChanges.length > 0) {
          const dict: Record<string, {x:number, y:number}> = {};
          posChanges.forEach(n => dict[n.id] = n.position);
          updateNodesPositions(dict);
        }
        return updated;
      });
    },
    [setNodes, updateNodesPositions]
  );

  return (
    <div className="w-full h-full bg-[rgba(0,0,0,0)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: !!1 }}
      >
        <Controls />
      </ReactFlow>
    </div>
  );
}
