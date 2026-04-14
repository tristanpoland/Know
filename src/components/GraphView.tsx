// components/GraphView.tsx — Knowledge graph visualization
// Simple node-link diagram showing the relationship structure.
import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./GraphView.css";

interface GraphNode {
  id: number;
  data: {
    type: string;
    path?: string;
    qualified_path?: string;
    name?: string;
    kind?: string;
    title?: string;
  };
}

interface GraphEdge {
  from: number;
  to: number;
  data: { type: string };
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const NODE_COLORS: Record<string, string> = {
  rust_file: "#ffa94d",
  markdown_file: "#69db7c",
  rust_item: "#4dabf7",
};

const EDGE_COLORS: Record<string, string> = {
  defines: "#4dabf7",
  references: "#909296",
  documents: "#69db7c",
  implements: "#cc5de8",
  contains: "#373a40",
};

export function GraphView() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    invoke<GraphData>("get_graph")
      .then((data) => {
        setGraphData(data);
        setStats({ nodes: data.nodes.length, edges: data.edges.length });
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="graph-loading">Loading knowledge graph…</div>;
  }

  if (error) {
    return <div className="graph-error">Error: {error}</div>;
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="graph-empty">
        <p>Knowledge graph is empty.</p>
        <p>Open a repository to build the graph.</p>
      </div>
    );
  }

  return (
    <div className="graph-view">
      <div className="graph-toolbar">
        <span className="graph-stat">{stats.nodes} nodes</span>
        <span className="graph-stat">{stats.edges} edges</span>
        <div className="graph-legend">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <span key={type} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              {type.replace("_", " ")}
            </span>
          ))}
        </div>
      </div>
      <div className="graph-canvas-wrap">
        <GraphCanvas data={graphData} />
      </div>
    </div>
  );
}

/** Simple static force-layout SVG graph for MVP. */
function GraphCanvas({ data }: { data: GraphData }) {
  const WIDTH = 900;
  const HEIGHT = 600;
  const PADDING = 40;

  // Simple circular layout for MVP
  const nodePositions = computeLayout(data.nodes, WIDTH, HEIGHT, PADDING);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="graph-svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Edges */}
      <g className="edges">
        {data.edges.map((edge, i) => {
          const from = nodePositions.get(edge.from);
          const to = nodePositions.get(edge.to);
          if (!from || !to) return null;
          const color = EDGE_COLORS[edge.data.type] ?? "#373a40";
          return (
            <line
              key={i}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={color}
              strokeWidth="1"
              strokeOpacity="0.4"
            />
          );
        })}
      </g>

      {/* Nodes */}
      <g className="nodes">
        {data.nodes.map((node) => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;
          const color = NODE_COLORS[node.data.type] ?? "#909296";
          const label = node.data.name ?? node.data.title ?? node.data.path?.split(/[/\\]/).pop() ?? "?";
          const isHovered = hoveredNode === node.id;

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x},${pos.y})`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                r={isHovered ? 8 : 5}
                fill={color}
                fillOpacity={isHovered ? 1 : 0.8}
                stroke={isHovered ? "#fff" : "none"}
                strokeWidth="1.5"
              />
              {isHovered && (
                <text
                  x={10} y={4}
                  fontSize="10"
                  fill="#fff"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {label.length > 30 ? label.slice(0, 30) + "…" : label}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

interface Pos { x: number; y: number; }

function computeLayout(
  nodes: GraphNode[],
  width: number,
  height: number,
  padding: number
): Map<number, Pos> {
  const map = new Map<number, Pos>();
  const count = nodes.length;
  if (count === 0) return map;

  // Group by type for better visual separation
  const groups: Record<string, GraphNode[]> = {};
  for (const node of nodes) {
    const t = node.data.type;
    if (!groups[t]) groups[t] = [];
    groups[t].push(node);
  }

  const groupKeys = Object.keys(groups);
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;
  const colWidth = usableW / Math.max(groupKeys.length, 1);

  groupKeys.forEach((gKey, gi) => {
    const grpNodes = groups[gKey];
    const cx = padding + gi * colWidth + colWidth / 2;
    const rowHeight = usableH / Math.max(grpNodes.length, 1);

    grpNodes.forEach((node, ni) => {
      const y = padding + ni * rowHeight + rowHeight / 2;
      map.set(node.id, { x: cx, y });
    });
  });

  return map;
}
