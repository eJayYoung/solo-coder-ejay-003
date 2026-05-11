import React, { useState, useEffect, useMemo } from 'react';
import { Toolbar } from './components/Toolbar';
import { MindMapCanvas } from './components/MindMapCanvas';
import { useMindMapStore } from './store/mindMapStore';
import { themeConfigs } from './types';
import { useCollaboration } from './hooks/useCollaboration';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const {
    mindMapData,
    currentTheme,
    error,
    setMindMapData
  } = useMindMapStore();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [userId] = useState(() => uuidv4());
  const [userName] = useState(`用户${Math.floor(Math.random() * 1000)}`);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const sharedSessionId = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('session');
  }, []);

  const sessionId = sharedSessionId || mindMapData?.id || null;

  useCollaboration(sessionId, userId, userName);

  const theme = themeConfigs[currentTheme];

  const handleStartCollaboration = () => {
    if (!mindMapData) {
      alert('请先生成思维导图');
      return;
    }
    setShowCollabModal(true);
  };

  const handleCopyLink = async () => {
    if (!sessionId) return;
    const link = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddNode = () => {
    if (!mindMapData) return;
    const parentId = selectedNodeId || mindMapData.nodes.find(n => n.type === 'root')?.id;
    if (!parentId) return;

    const parentNode = mindMapData.nodes.find(n => n.id === parentId);
    const existingChildren = mindMapData.edges
      .filter(e => e.source === parentId)
      .map(e => e.target);

    const newNodeId = uuidv4();
    const newEdgeId = uuidv4();

    let newX = (parentNode?.x || 0) + 200;
    let newY = (parentNode?.y || 0) + existingChildren.length * 80;

    setMindMapData({
      ...mindMapData,
      nodes: [
        ...mindMapData.nodes,
        {
          id: newNodeId,
          label: '新节点',
          type: 'leaf',
          parentId,
          x: newX,
          y: newY
        }
      ],
      edges: [
        ...mindMapData.edges,
        {
          id: newEdgeId,
          source: parentId,
          target: newNodeId
        }
      ],
      updatedAt: Date.now()
    });

    setSelectedNodeId(newNodeId);
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId || !mindMapData) return;

    const nodesToDelete = new Set<string>([selectedNodeId]);
    const edgesToCheck = [...mindMapData.edges];
    const queue = [selectedNodeId];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      edgesToCheck.forEach(edge => {
        if (edge.source === nodeId && !nodesToDelete.has(edge.target)) {
          nodesToDelete.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    setMindMapData({
      ...mindMapData,
      nodes: mindMapData.nodes.filter(n => !nodesToDelete.has(n.id)),
      edges: mindMapData.edges.filter(
        e => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target)
      ),
      updatedAt: Date.now()
    });

    setSelectedNodeId(null);
  };

  return (
    <div
      className="app"
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.bg,
        transition: 'background-color 0.3s ease'
      }}
    >
      <Toolbar
        onStartCollaboration={handleStartCollaboration}
        onAddNode={handleAddNode}
        onDeleteSelected={handleDeleteSelected}
        selectedNodeId={selectedNodeId}
      />

      <div
        className="canvas-wrapper"
        style={{
          flex: 1,
          marginTop: '80px',
          position: 'relative'
        }}
      >
        {error && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              padding: '12px 24px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            {error}
          </div>
        )}

        <MindMapCanvas
          onNodeSelect={setSelectedNodeId}
          selectedNodeId={selectedNodeId}
        />
      </div>

      {showCollabModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowCollabModal(false)}
        >
          <div
            style={{
              backgroundColor: theme.toolbarBg,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: theme.text
              }}
            >
              多人协同
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: theme.text,
                opacity: 0.7,
                marginBottom: '24px'
              }}
            >
              分享此链接给其他用户，他们可以实时查看和编辑你的思维导图
            </p>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              <input
                type="text"
                readOnly
                value={`${window.location.origin}${window.location.pathname}?session=${sessionId}`}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.nodeBorder}`,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: copied ? '#22c55e' : theme.buttonBg,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {copied ? '已复制 ✓' : '复制链接'}
              </button>
            </div>

            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <button
                onClick={() => setShowCollabModal(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.nodeBorder}`,
                  backgroundColor: 'transparent',
                  color: theme.text,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
