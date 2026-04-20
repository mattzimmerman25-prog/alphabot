'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface GraphNode {
  id: string
  type: 'entity' | 'concept' | 'source'
  name: string
  size: number // Number of connections
  group: number // For coloring
}

interface GraphLink {
  source: string
  target: string
  value: number // Strength of connection
  type: 'mentions' | 'contradicts' | 'supports'
}

interface KnowledgeGraphProps {
  nodes: GraphNode[]
  links: GraphLink[]
  onNodeClick?: (node: GraphNode) => void
  width?: number
  height?: number
}

export default function KnowledgeGraph({
  nodes,
  links,
  onNodeClick,
  width = 1200,
  height = 800
}: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    // Color scale
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['entity', 'concept', 'source'])
      .range(['#60A5FA', '#A78BFA', '#34D399'])

    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d: GraphLink) => {
        if (d.type === 'contradicts') return '#EF4444'
        if (d.type === 'supports') return '#10B981'
        return '#6B7280'
      })
      .attr('stroke-width', (d: GraphLink) => Math.sqrt(d.value))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', (d: GraphLink) =>
        d.type === 'contradicts' ? '5,5' : '0'
      )

    // Draw nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: GraphNode) => 5 + Math.sqrt(d.size) * 2)
      .attr('fill', (d: GraphNode) => colorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event: any, d: GraphNode) => {
        setSelectedNode(d)
        onNodeClick?.(d)
      })
      .on('mouseover', function(event: any, d: GraphNode) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (5 + Math.sqrt(d.size) * 2) * 1.5)
          .attr('stroke-width', 3)

        // Show tooltip
        tooltip
          .style('display', 'block')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px')
          .html(`
            <div class="font-semibold">${d.name}</div>
            <div class="text-sm text-gray-400">${d.type}</div>
            <div class="text-xs text-gray-500">${d.size} connections</div>
          `)
      })
      .on('mouseout', function(event: any, d: GraphNode) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 5 + Math.sqrt(d.size) * 2)
          .attr('stroke-width', 2)

        tooltip.style('display', 'none')
      })
      .call(d3.drag<any, GraphNode>()
        .on('start', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event: any, d: any) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }) as any
      )

    // Add labels
    const label = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d: GraphNode) => d.name)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', 4)
      .attr('fill', '#E5E7EB')
      .style('pointer-events', 'none')

    // Create tooltip
    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('display', 'none')
      .style('background', '#1F2937')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('z-index', '1000')
      .style('pointer-events', 'none')
      .style('box-shadow', '0 4px 6px rgba(0,0,0,0.3)')

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y)
    })

    // Cleanup
    return () => {
      simulation.stop()
      tooltip.remove()
    }
  }, [nodes, links, width, height, onNodeClick])

  return (
    <div className="relative">
      <svg ref={svgRef} className="bg-gray-900 rounded-lg border border-gray-700" />

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg border border-gray-700 text-sm">
        <div className="font-semibold mb-2">Legend</div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-400"></div>
            <span>Entity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-purple-400"></div>
            <span>Concept</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-400"></div>
            <span>Source</span>
          </div>
          <div className="border-t border-gray-600 my-2"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-gray-500"></div>
            <span>Mentions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-red-500" style={{ borderTop: '2px dashed' }}></div>
            <span>Contradicts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-green-500"></div>
            <span>Supports</span>
          </div>
        </div>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-gray-800 p-4 rounded-lg border border-gray-700 max-w-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
              <p className="text-sm text-gray-400">{selectedNode.type}</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-gray-300">
            {selectedNode.size} connections in wiki
          </div>
        </div>
      )}
    </div>
  )
}
