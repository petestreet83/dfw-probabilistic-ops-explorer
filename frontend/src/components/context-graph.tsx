import "@react-sigma/core/lib/style.css";

import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
  useLoadGraph,
  useRegisterEvents,
  useSetSettings,
} from "@react-sigma/core";
import { MultiDirectedGraph } from "graphology";
import { useEffect, useMemo } from "react";

import { useCommandCenterStore } from "@/store/use-command-center-store";
import type {
  CommunitySummary,
  GraphEdgeRecord,
  GraphNodeRecord,
  QueryPreset,
} from "@/types";

function colorForEdge(kind: GraphEdgeRecord["kind"]): string {
  switch (kind) {
    case "query":
      return "#22d3ee";
    case "handoff":
      return "#fb7185";
    case "evidence":
      return "#fbbf24";
    default:
      return "#818cf8";
  }
}

function GraphScene({
  nodes,
  edges,
  queries,
  communities,
}: {
  nodes: GraphNodeRecord[];
  edges: GraphEdgeRecord[];
  queries: QueryPreset[];
  communities: CommunitySummary[];
}) {
  const loadGraph = useLoadGraph();
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();

  const selectedNodeId = useCommandCenterStore((state) => state.selectedNodeId);
  const selectedCommunityId = useCommandCenterStore(
    (state) => state.selectedCommunityId,
  );
  const selectedQueryId = useCommandCenterStore(
    (state) => state.selectedQueryId,
  );
  const searchTerm = useCommandCenterStore((state) =>
    state.searchTerm.toLowerCase(),
  );
  const setSelectedNodeId = useCommandCenterStore(
    (state) => state.setSelectedNodeId,
  );

  const activeQuery = useMemo(
    () => queries.find((query) => query.id === selectedQueryId) ?? queries[0],
    [queries, selectedQueryId],
  );

  const activeCommunity = useMemo(
    () =>
      communities.find((community) => community.id === selectedCommunityId) ??
      null,
    [communities, selectedCommunityId],
  );

  const graph = useMemo(() => {
    const nextGraph = new MultiDirectedGraph();

    nodes.forEach((node) => {
      nextGraph.addNode(node.id, {
        x: node.x,
        y: node.y,
        label: node.label,
        size: node.size,
        color: node.color,
        kind: node.kind,
        clusterId: node.clusterId,
      });
    });

    edges.forEach((edge) => {
      nextGraph.addEdgeWithKey(edge.id, edge.source, edge.target, {
        size: 0.8 + edge.weight * 0.45,
        color: colorForEdge(edge.kind),
        label: edge.summary,
      });
    });

    return nextGraph;
  }, [edges, nodes]);

  const highlightedNodeIds = useMemo(() => {
    const selected = new Set<string>(activeQuery.nodeIds);

    if (activeCommunity) {
      activeCommunity.nodeIds.forEach((nodeId) => selected.add(nodeId));
    }

    if (selectedNodeId) {
      selected.add(selectedNodeId);
      edges.forEach((edge) => {
        if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
          selected.add(edge.source);
          selected.add(edge.target);
        }
      });
    }

    if (searchTerm) {
      nodes
        .filter(
          (node) =>
            node.label.toLowerCase().includes(searchTerm) ||
            node.summary.toLowerCase().includes(searchTerm),
        )
        .forEach((node) => selected.add(node.id));
    }

    return selected;
  }, [
    activeCommunity,
    activeQuery.nodeIds,
    edges,
    nodes,
    searchTerm,
    selectedNodeId,
  ]);

  const highlightedEdgeIds = useMemo(() => {
    const selected = new Set<string>(activeQuery.edgeIds);

    if (activeCommunity) {
      activeCommunity.edgeIds.forEach((edgeId) => selected.add(edgeId));
    }

    if (selectedNodeId) {
      edges.forEach((edge) => {
        if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
          selected.add(edge.id);
        }
      });
    }

    return selected;
  }, [activeCommunity, activeQuery.edgeIds, edges, selectedNodeId]);

  useEffect(() => {
    loadGraph(graph);
  }, [graph, loadGraph]);

  useEffect(() => {
    setSettings({
      renderLabels: true,
      labelDensity: 0.08,
      labelGridCellSize: 100,
      labelRenderedSizeThreshold: 10,
      defaultEdgeType: "line",
      nodeReducer: (node, data) => {
        const isHighlighted = highlightedNodeIds.has(node);
        const isSelected = node === selectedNodeId;

        return {
          ...data,
          zIndex: isSelected ? 2 : isHighlighted ? 1 : 0,
          forceLabel: isSelected || isHighlighted,
          color: isHighlighted ? data.color : "rgba(71, 85, 105, 0.34)",
          size: isSelected
            ? data.size * 1.22
            : isHighlighted
              ? data.size
              : data.size * 0.78,
        };
      },
      edgeReducer: (edge, data) => {
        const isHighlighted = highlightedEdgeIds.has(edge);

        return {
          ...data,
          hidden: !isHighlighted && highlightedNodeIds.size > 0,
          color: isHighlighted ? data.color : "rgba(71, 85, 105, 0.2)",
          size: isHighlighted ? data.size : data.size * 0.5,
        };
      },
    });
  }, [highlightedEdgeIds, highlightedNodeIds, selectedNodeId, setSettings]);

  useEffect(() => {
    registerEvents({
      clickNode: ({ node }) => setSelectedNodeId(node),
      clickStage: () => setSelectedNodeId(null),
    });
  }, [registerEvents, setSelectedNodeId]);

  return null;
}

export function ContextGraph({
  nodes,
  edges,
  queries,
  communities,
}: {
  nodes: GraphNodeRecord[];
  edges: GraphEdgeRecord[];
  queries: QueryPreset[];
  communities: CommunitySummary[];
}) {
  return (
    <div className="relative h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-[0_0_0_1px_rgba(34,211,238,0.1),0_20px_80px_rgba(15,23,42,0.65)]">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            Interactive graph
          </p>
          <h2 className="text-sm font-semibold text-white">
            Knowledge graph / agent execution fabric
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-cyan-200">
            Sigma.js
          </span>
          <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-1 text-violet-200">
            Graphology
          </span>
        </div>
      </div>
      <SigmaContainer
        style={{ height: "100%", width: "100%" }}
        settings={{
          allowInvalidContainer: true,
          renderLabels: true,
          labelColor: { color: "#e2e8f0" },
          defaultNodeType: "circle",
          defaultEdgeColor: "#22d3ee",
          minCameraRatio: 0.4,
          maxCameraRatio: 2.5,
        }}
      >
        <GraphScene
          nodes={nodes}
          edges={edges}
          queries={queries}
          communities={communities}
        />
        <ControlsContainer
          position="bottom-right"
          className="m-3 rounded-2xl border border-white/10 bg-slate-900/90 p-1 backdrop-blur"
        >
          <ZoomControl className="text-white" />
          <FullScreenControl className="text-white" />
        </ControlsContainer>
      </SigmaContainer>
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-300 backdrop-blur">
        <p>Node glow = active query, community filter, or direct selection.</p>
        <p className="text-slate-500">
          Click a node to inspect evidence and adjacent paths.
        </p>
      </div>
    </div>
  );
}
