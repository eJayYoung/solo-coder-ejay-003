import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  EdgeChange,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  Handle,
  Position,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMindMapStore } from '../store/mindMapStore';
import { themeConfigs, MindMapData } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface MindMapCanvasProps {
  onNodeSelect: (nodeId: string | null) => void;
  selectedNodeId: string | null;
}

const getNodeStyle = (nodeType?: string, isSelected?: boolean, theme = 'light') => {
  const config = themeConfigs[theme];
  let bgColor = config.nodeBg;
  let textColor = config.nodeText;
  let fontSize = '14px';
  let padding = '12px 16px';
  let borderRadius = '12px';
  let fontWeight = 400;
  let boxShadow = '0 2px 8px rgba(0,0,0,0.08)';

  if (nodeType === 'root') {
    bgColor = config.nodeBgRoot;
    textColor = 'white';
    fontSize = '18px';
    padding = '16px 24px';
    borderRadius = '16px';
    fontWeight = 700;
    boxShadow = `0 4px 16px ${config.nodeBgRoot}40`;
  } else if (nodeType === 'branch') {
    bgColor = config.nodeBgBranch;
    textColor = 'white';
    fontSize = '15px';
    padding = '14px 20px';
    borderRadius = '14px';
    fontWeight = 600;
    boxShadow = `0 3px 12px ${config.nodeBgBranch}30`;
  } else if (nodeType === 'leaf') {
    bgColor = config.nodeBgLeaf;
    textColor = 'white';
    fontSize = '13px';
    padding = '10px 16px';
    borderRadius = '10px';
    boxShadow = `0 2px 8px ${config.nodeBgLeaf}20`;
  }

  if (isSelected) {
    boxShadow = `0 0 0 3px ${config.buttonBg}40`;
  }

  return {
    padding,
    fontSize,
    fontWeight,
    borderRadius,
    backgroundColor: bgColor,
    color: textColor,
    border: isSelected ? `2px solid ${config.buttonBg}` : 'none',
    boxShadow,
    whiteSpace: 'nowrap' as const,
    cursor: 'move'
  };
};

const MindMapNode: React.FC<NodeProps<{ label: string; type?: string; nodeId?: string }>> = ({
  data,
  selected,
  id
}) => {
  const { currentTheme, updateNode } = useMindMapStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(data.label);
  };

  const handleBlur = () => {
    if (editValue.trim() && editValue !== data.label) {
      updateNode(id, { label: editValue.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const style = getNodeStyle(data.type, selected, currentTheme);

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '80px',
        textAlign: 'center'
      }}
    >
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: style.color,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            textAlign: 'center',
            width: `${editValue.length * 10 + 20}px`
          }}
        />
      ) : (
        <span>{data.label}</span>
      )}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};

const nodeTypes = {
  mindMapNode: MindMapNode
};

function calculateLayout(mindMapData: MindMapData): { nodes: Node[]; edges: Edge[] } {
  const { nodes, edges } = mindMapData;
  const nodeWidth = 160;
  const nodeHeight = 50;
  const levelGap = 220;
  const nodeGap = 80;

  const rootNode = nodes.find((n) => n.type === 'root');
  if (!rootNode) {
    return { nodes: [], edges: [] };
  }

  const levelGroups: { [key: number]: string[] } = {};

  const visited = new Set<string>();
  const queue: { nodeId: string; level: number }[] = [{ nodeId: rootNode.id, level: 0 }];

  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    if (!levelGroups[level]) {
      levelGroups[level] = [];
    }
    levelGroups[level].push(nodeId);

    const children = edges
      .filter((e) => e.source === nodeId)
      .map((e) => e.target);
    for (const childId of children) {
      queue.push({ nodeId: childId, level: level + 1 });
    }
  }

  const centerX = 800;
  const centerY = 400;
  const positions: { [nodeId: string]: { x: number; y: number } } = {};

  const maxLevel = Math.max(...Object.keys(levelGroups).map(Number));
  const rootX = centerX - (maxLevel * levelGap) / 2;

  Object.keys(levelGroups).forEach((levelStr) => {
    const level = parseInt(levelStr);
    const levelNodes = levelGroups[level];
    const x = rootX + level * levelGap;

    const totalHeight = levelNodes.length * (nodeHeight + nodeGap) - nodeGap;
    const startY = centerY - totalHeight / 2;

    levelNodes.forEach((nodeId, index) => {
      const y = startY + index * (nodeHeight + nodeGap);
      positions[nodeId] = { x, y };
    });
  });

  const flowNodes: Node[] = nodes.map((node) => ({
    id: node.id,
    type: 'mindMapNode',
    position: node.x !== undefined && node.y !== undefined
      ? { x: node.x, y: node.y }
      : positions[node.id] || { x: 0, y: 0 },
    data: { label: node.label, type: node.type }
  }));

  const flowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: false,
    style: {
      strokeWidth: 2
    }
  }));

  return { nodes: flowNodes, edges: flowEdges };
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  onNodeSelect,
  selectedNodeId
}) => {
  const { mindMapData, currentTheme, setMindMapData } = useMindMapStore();
  const theme = themeConfigs[currentTheme];

  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);

  React.useEffect(() => {
    if (!mindMapData) {
      setFlowNodes([]);
      setFlowEdges([]);
      return;
    }

    const existingNodeIds = new Set(flowNodes.map(n => n.id));
    const newNodeIds = new Set(mindMapData.nodes.map(n => n.id));

    const deletedIds = new Set([...existingNodeIds].filter(id => !newNodeIds.has(id)));
    const addedIds = new Set([...newNodeIds].filter(id => !existingNodeIds.has(id)));

    if (deletedIds.size > 0 || addedIds.size > 0) {
      const { nodes, edges } = calculateLayout(mindMapData);
      setFlowNodes(nodes);
      setFlowEdges(edges);
    } else {
      setFlowNodes(prevNodes =>
        prevNodes.map(node => {
          const dataNode = mindMapData.nodes.find(n => n.id === node.id);
          if (dataNode && dataNode.label !== node.data.label) {
            return {
              ...node,
              data: { ...node.data, label: dataNode.label }
            };
          }
          return node;
        })
      );
    }
  }, [mindMapData?.id, mindMapData?.updatedAt]);

  React.useEffect(() => {
    if (mindMapData) {
      const posChanged = flowNodes.some((n, i) => {
        const original = initialNodes[i];
        return original && (n.position.x !== original.position.x || n.position.y !== original.position.y);
      });

      if (posChanged) {
        const positions: { [nodeId: string]: { x: number; y: number } } = {};
        flowNodes.forEach((n) => {
          positions[n.id] = n.position;
        });

        setMindMapData({
          ...mindMapData,
          nodes: mindMapData.nodes.map((node) => ({
            ...node,
            x: positions[node.id]?.x ?? node.x,
            y: positions[node.id]?.y ?? node.y
          })),
          updatedAt: Date.now()
        });
      }
    }
  }, [flowNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setFlowNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setFlowEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: uuidv4(),
        type: 'smoothstep',
        animated: false,
        style: { strokeWidth: 2 }
      };
      setFlowEdges((eds) => addEdge(newEdge, eds));

      if (mindMapData && params.source && params.target) {
        setMindMapData({
          ...mindMapData,
          edges: [
            ...mindMapData.edges,
            {
              id: uuidv4(),
              source: params.source,
              target: params.target
            }
          ],
          updatedAt: Date.now()
        });
      }
    },
    [mindMapData, setMindMapData]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  if (!mindMapData) {
    return (
      <div
        className="empty-state"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: theme.text,
          opacity: 0.6
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
        <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
          开始创建你的思维导图
        </div>
        <div style={{ fontSize: '14px' }}>在上方输入主题，然后点击"生成"按钮</div>
      </div>
    );
  }

  const edgeStyle = {
    stroke: theme.edgeColor,
    strokeWidth: 2
  };

  return (
    <div
      id="mind-map-canvas"
      style={{
        height: '100%',
        width: '100%'
      }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges.map((e) => ({ ...e, style: edgeStyle }))}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        selectionOnDrag
        nodesDraggable
        nodesConnectable
        elementsSelectable
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: edgeStyle
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={theme.nodeBorder} />
        <Controls
          style={{
            backgroundColor: theme.toolbarBg,
            border: `1px solid ${theme.nodeBorder}`,
            borderRadius: '8px'
          }}
        />
        <MiniMap
          style={{
            backgroundColor: theme.toolbarBg,
            border: `1px solid ${theme.nodeBorder}`,
            borderRadius: '8px'
          }}
          nodeColor={(node) => {
            const nodeType = (node.data as any)?.type;
            if (nodeType === 'root') return theme.nodeBgRoot;
            if (nodeType === 'branch') return theme.nodeBgBranch;
            return theme.nodeBgLeaf;
          }}
          maskColor={`${theme.bg}cc`}
        />
      </ReactFlow>
    </div>
  );
};
