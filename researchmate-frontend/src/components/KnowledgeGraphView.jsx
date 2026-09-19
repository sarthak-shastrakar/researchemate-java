// src/components/KnowledgeGraphView.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { RefreshCw, Network, Info, AlertTriangle, Sparkles, Download, Image, FileJson, ChevronDown } from 'lucide-react';
import { getKnowledgeGraph, buildKnowledgeGraph } from '../api/projects';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../context/ToastContext';

const NODE_COLORS = {
  CONCEPT: '#6366f1',   // Indigo
  TECHNOLOGY: '#14b8a6',// Teal
  PERSON: '#f59e0b',    // Amber
  OTHER: '#6b7280',     // Gray
};

const getNodeColor = (type) => NODE_COLORS[type?.toUpperCase()] || NODE_COLORS.OTHER;

export default function KnowledgeGraphView({ projectId, projectName }) {
  const toast = useToast();
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const menuRef = useRef(null);

  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update container size dynamically
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 800,
          height: 500,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const formatGraphData = useCallback((data) => {
    if (!data || !Array.isArray(data.nodes)) {
      return { nodes: [], links: [] };
    }

    const nodes = data.nodes.map((n) => ({
      id: String(n.id),
      name: n.name || `Node ${n.id}`,
      type: n.type || 'OTHER',
    }));

    const links = (Array.isArray(data.edges) ? data.edges : [])
      .map((e) => ({
        source: String(e.sourceId || e.source),
        target: String(e.targetId || e.target),
        label: e.label || e.relationshipLabel || '',
      }))
      .filter((l) => l.source && l.target);

    return { nodes, links };
  }, []);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getKnowledgeGraph(projectId);
      setGraphData(formatGraphData(data));
    } catch (err) {
      setError(err.message || 'Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  }, [projectId, formatGraphData]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const handleBuildGraph = async () => {
    setBuilding(true);
    setError('');
    setSelectedNode(null);
    try {
      const data = await buildKnowledgeGraph(projectId);
      const formatted = formatGraphData(data);
      setGraphData(formatted);

      if (formatted.nodes.length === 0) {
        toast('Knowledge graph build completed, but no entities were extracted. Make sure your project sources have summaries.', 'warning');
      } else {
        toast('Knowledge graph generated successfully!', 'success');
      }
    } catch (err) {
      const msg = err.message || 'Failed to build knowledge graph. Please make sure you have summarized sources in this project.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setBuilding(false);
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const downloadPng = () => {
    setShowDownloadMenu(false);
    try {
      const canvas = fgRef.current?.getCanvas?.() || containerRef.current?.querySelector('canvas');
      if (!canvas) {
        toast('Could not find graph canvas element', 'error');
        return;
      }

      // Create export canvas with solid white fill background
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext('2d');

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Draw current graph canvas over white background
      ctx.drawImage(canvas, 0, 0);

      const imageUri = exportCanvas.toDataURL('image/png');
      const safeProjectName = projectName ? projectName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'project';
      const fileName = `${safeProjectName}-knowledge-graph.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = imageUri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Knowledge graph image downloaded', 'success');
    } catch (err) {
      toast('Failed to export graph image: ' + err.message, 'error');
    }
  };

  const downloadJson = () => {
    setShowDownloadMenu(false);
    try {
      const cleanData = {
        nodes: graphData.nodes.map((n) => ({ id: n.id, name: n.name, type: n.type })),
        edges: graphData.links.map((l) => ({
          source: typeof l.source === 'object' ? l.source.id : l.source,
          target: typeof l.target === 'object' ? l.target.id : l.target,
          label: l.label,
        })),
      };

      const jsonString = JSON.stringify(cleanData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const safeProjectName = projectName ? projectName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'project';
      const fileName = `${safeProjectName}-knowledge-graph.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast('Knowledge graph JSON downloaded', 'success');
    } catch (err) {
      toast('Failed to export graph JSON: ' + err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white rounded-xl border border-slate-200">
        <LoadingSpinner />
        <p className="mt-4 text-sm font-medium">Loading knowledge graph...</p>
      </div>
    );
  }

  const hasNodes = graphData.nodes && graphData.nodes.length > 0;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" />
            Project Knowledge Graph
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-extracted entity relationships from your project summaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowDownloadMenu((prev) => !prev)}
              disabled={!hasNodes || building}
              title={!hasNodes ? 'No graph data available to download' : 'Download Graph'}
              className="inline-flex items-center justify-center px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDownloadMenu && hasNodes && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1.5">
                <button
                  onClick={downloadPng}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Image className="w-4 h-4 text-indigo-500" />
                  <span>Download as Image (PNG)</span>
                </button>
                <button
                  onClick={downloadJson}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileJson className="w-4 h-4 text-teal-500" />
                  <span>Download as Data (JSON)</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleBuildGraph}
            disabled={building}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${building ? 'animate-spin' : ''}`} />
            {building ? 'Analyzing research...' : hasNodes ? 'Rebuild Graph' : 'Build Knowledge Graph'}
          </button>
        </div>
      </div>

      {/* Building Overlay / Loading Banner */}
      {building && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3 text-indigo-800">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse shrink-0" />
          <div>
            <p className="text-sm font-medium">Analyzing your research... this may take a moment</p>
            <p className="text-xs text-indigo-600 mt-0.5">AI is parsing all your source summaries to construct nodes and connections.</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !building && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Unable to generate Knowledge Graph</p>
            <p className="mt-1 text-xs text-amber-700">{error}</p>
            <p className="mt-2 text-xs font-medium text-amber-900">Tip: Add source documents/links to this project and summarize them first before building the graph.</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasNodes && !building ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
            <Network className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-900">No knowledge graph yet</h4>
          <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
            Generate an interactive visual graph of key concepts, technologies, and persons extracted from your research sources.
          </p>
          <button
            onClick={handleBuildGraph}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors gap-2 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            Build Knowledge Graph
          </button>
        </div>
      ) : (
        /* Graph Container */
        hasNodes && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs relative">
            <div ref={containerRef} className="w-full relative bg-slate-50/50" style={{ height: '500px' }}>
              <ForceGraph2D
                ref={fgRef}
                backgroundColor="#ffffff"
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeId="id"
                nodeLabel={(node) => `${node.name} (${node.type})`}
                linkLabel={(link) => link.label}
                onNodeClick={handleNodeClick}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = Math.max(10 / globalScale, 3);
                  const radius = 6;
                  const color = getNodeColor(node.type);

                  // Node Circle
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = color;
                  ctx.fill();
                  ctx.lineWidth = 1.5 / globalScale;
                  ctx.strokeStyle = '#ffffff';
                  ctx.stroke();

                  // Selected Highlight Ring
                  if (selectedNode && selectedNode.id === node.id) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius + 3 / globalScale, 0, 2 * Math.PI, false);
                    ctx.strokeStyle = '#4f46e5';
                    ctx.lineWidth = 2 / globalScale;
                    ctx.stroke();
                  }

                  // Label Text Below Node — Dark high-contrast text
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillStyle = '#0f172a';
                  ctx.fillText(label, node.x, node.y + radius + 2);
                }}
                linkCanvasObject={(link, ctx, globalScale) => {
                  const start = link.source;
                  const end = link.target;

                  if (!start || !end || typeof start !== 'object' || typeof end !== 'object') return;

                  // Edge Line
                  ctx.beginPath();
                  ctx.moveTo(start.x, start.y);
                  ctx.lineTo(end.x, end.y);
                  ctx.strokeStyle = '#94a3b8';
                  ctx.lineWidth = 1.5 / globalScale;
                  ctx.stroke();

                  // Edge Label Text — Dark high-contrast text
                  if (link.label) {
                    const fontSize = Math.max(9 / globalScale, 2.5);
                    const midX = (start.x + end.x) / 2;
                    const midY = (start.y + end.y) / 2;

                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.fillStyle = '#1e293b';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(link.label, midX, midY);
                  }
                }}
              />

              {/* Selected Node Details Floating Overlay */}
              {selectedNode && (
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200 shadow-md max-w-xs z-10 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Node Selected</span>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{selectedNode.name}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: getNodeColor(selectedNode.type) }}
                    />
                    <span className="text-xs font-medium text-slate-700">{selectedNode.type}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Color Legend Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-medium">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Node Types:</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
                    <span className="capitalize">{type.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
