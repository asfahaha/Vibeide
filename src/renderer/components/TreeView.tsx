import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeTypes,
  BackgroundVariant,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTreeStore } from '../store';
import ConversationNodeComponent from './ConversationNode';

const nodeTypes: NodeTypes = {
  conversation: ConversationNodeComponent
};

export default function TreeView() {
  const { nodes, positions, selectedNodeId, selectNode, createNode, updatePosition } = useTreeStore();

  // Convert store nodes to React Flow nodes
  const flowNodes = useMemo((): Node[] => {
    return nodes.map((node) => {
      const position = positions[node.id] || { x: 100, y: 100 };
      return {
        id: node.id,
        type: 'conversation',
        position: { x: position.x, y: position.y },
        data: {
          ...node,
          selected: node.id === selectedNodeId
        }
      };
    });
  }, [nodes, positions, selectedNodeId]);

  // Convert parent-child relationships to edges
  const flowEdges = useMemo((): Edge[] => {
    return nodes
      .filter((node) => node.parent_id !== null)
      .map((node) => ({
        id: `${node.parent_id}-${node.id}`,
        source: node.parent_id!,
        target: node.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#E0E0E0', strokeWidth: 2 }
      }));
  }, [nodes]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(flowNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync with store when nodes change
  useMemo(() => {
    setRfNodes(flowNodes);
    setRfEdges(flowEdges);
  }, [flowNodes, flowEdges, setRfNodes, setRfEdges]);

  const onConnect = useCallback(
    (params: Connection) => setRfEdges((eds) => addEdge(params, eds)),
    [setRfEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updatePosition(node.id, node.position.x, node.position.y);
    },
    [updatePosition]
  );

  const handleCreateRoot = async () => {
    await createNode({ parent_id: null, title: 'New Research' });
  };

  return (
    <div className="h-full w-full bg-canvas">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#E0E0E0"
        />
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) =>
            node.data?.selected ? '#0066CC' : '#E0E0E0'
          }
          maskColor="rgba(250, 250, 250, 0.8)"
        />
        <Panel position="top-left" className="flex gap-2">
          <button
            onClick={handleCreateRoot}
            className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-hover text-text-inverse rounded text-sm font-medium transition-colors shadow-elevation-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Root
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
