import React, { useState } from 'react';
import { Sparkles, Users, Download, Palette, Plus, Trash2 } from 'lucide-react';
import { useMindMapStore } from '../store/mindMapStore';
import { Theme, themeConfigs } from '../types';
import { generateMindMap } from '../services/apiService';
import { exportAsImage } from '../utils/exportUtils';

interface ToolbarProps {
  onStartCollaboration: () => void;
  onAddNode: () => void;
  onDeleteSelected: () => void;
  selectedNodeId: string | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onStartCollaboration,
  onAddNode,
  onDeleteSelected,
  selectedNodeId
}) => {
  const {
    currentTheme,
    setCurrentTheme,
    isGenerating,
    collaborators,
    isCollaborating,
    mindMapData
  } = useMindMapStore();

  const [topic, setTopic] = useState('');
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return;

    const store = useMindMapStore.getState();
    store.setIsGenerating(true);
    store.setError(null);

    try {
      const data = await generateMindMap(topic.trim());
      store.setMindMapData(data);
    } catch (err: any) {
      store.setError(err.message || '生成失败');
    } finally {
      store.setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportAsImage('mind-map-canvas', `${mindMapData?.title || 'mind-map'}.png`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const theme = themeConfigs[currentTheme];

  return (
    <div
      className="toolbar-wrapper"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '16px 24px',
        backgroundColor: theme.toolbarBg,
        borderBottom: `1px solid ${theme.nodeBorder}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}
    >
      <div
        className="logo"
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: theme.text,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Sparkles size={24} style={{ color: theme.buttonBg }} />
        AI 思维导图
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          flex: 1,
          maxWidth: '500px'
        }}
      >
        <input
          type="text"
          placeholder="输入主题，如：人工智能发展..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: `1px solid ${theme.nodeBorder}`,
            backgroundColor: theme.inputBg,
            color: theme.text,
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={!topic.trim() || isGenerating}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: theme.buttonBg,
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            cursor: (!topic.trim() || isGenerating) ? 'not-allowed' : 'pointer',
            opacity: (!topic.trim() || isGenerating) ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isGenerating ? '生成中...' : '生成'}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {mindMapData && (
          <>
            <button
              onClick={onAddNode}
              title="添加节点"
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${theme.nodeBorder}`,
                backgroundColor: 'transparent',
                color: theme.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={18} />
            </button>
            <button
              onClick={onDeleteSelected}
              disabled={!selectedNodeId}
              title="删除选中节点"
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${theme.nodeBorder}`,
                backgroundColor: 'transparent',
                color: selectedNodeId ? theme.text : '#94a3b8',
                cursor: selectedNodeId ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trash2 size={18} />
            </button>
          </>
        )}

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            title="主题"
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${theme.nodeBorder}`,
              backgroundColor: 'transparent',
              color: theme.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Palette size={18} />
            <span style={{ fontSize: '14px' }}>{theme.name}</span>
          </button>
          {showThemeDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: theme.toolbarBg,
                border: `1px solid ${theme.nodeBorder}`,
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                zIndex: 1001
              }}
            >
              {(Object.keys(themeConfigs) as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setCurrentTheme(t);
                    setShowThemeDropdown(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 20px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: currentTheme === t ? theme.buttonBg : 'transparent',
                    color: currentTheme === t ? 'white' : theme.text,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {themeConfigs[t].name}
                </button>
              ))}
            </div>
          )}
        </div>

        {mindMapData && (
          <button
            onClick={handleExport}
            title="导出图片"
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${theme.nodeBorder}`,
              backgroundColor: 'transparent',
              color: theme.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={18} />
            <span style={{ fontSize: '14px' }}>导出</span>
          </button>
        )}

        <button
          onClick={onStartCollaboration}
          title={isCollaborating ? '已开启协同' : '开始协同'}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: `1px solid ${isCollaborating ? theme.buttonBg : theme.nodeBorder}`,
            backgroundColor: isCollaborating ? `${theme.buttonBg}20` : 'transparent',
            color: isCollaborating ? theme.buttonBg : theme.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Users size={18} />
          <span style={{ fontSize: '14px' }}>
            {isCollaborating ? `协同 (${collaborators.length})` : '协同'}
          </span>
        </button>
      </div>
    </div>
  );
};
