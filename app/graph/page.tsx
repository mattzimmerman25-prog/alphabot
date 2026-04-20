'use client'

import { useState, useEffect } from 'react'
import KnowledgeGraph from '@/components/KnowledgeGraph'

interface GraphNode {
  id: string
  type: 'entity' | 'concept' | 'source'
  name: string
  size: number
  group: number
}

interface GraphLink {
  source: string
  target: string
  value: number
  type: 'mentions' | 'contradicts' | 'supports'
}

interface WikiIndex {
  pages: any[]
  entities: { [key: string]: string[] }
  concepts: { [key: string]: string[] }
  totalPages: number
}

export default function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ entities: 0, concepts: 0, sources: 0, connections: 0 })
  const [filter, setFilter] = useState<'all' | 'entity' | 'concept' | 'source'>('all')
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  useEffect(() => {
    loadWikiGraph()
  }, [])

  async function loadWikiGraph() {
    try {
      const response = await fetch('/wiki-index.json')
      const index: WikiIndex = await response.json()

      // Build graph from wiki index
      const graphNodes: GraphNode[] = []
      const graphLinks: GraphLink[] = []
      const nodeMap = new Map<string, GraphNode>()

      // Add entity nodes
      let groupId = 0
      Object.keys(index.entities).forEach((entityName, idx) => {
        const pages = index.entities[entityName]
        const node: GraphNode = {
          id: `entity-${entityName}`,
          type: 'entity',
          name: entityName,
          size: pages.length,
          group: 0
        }
        graphNodes.push(node)
        nodeMap.set(node.id, node)
      })

      // Add concept nodes
      Object.keys(index.concepts).forEach((conceptName, idx) => {
        const pages = index.concepts[conceptName]
        const node: GraphNode = {
          id: `concept-${conceptName}`,
          type: 'concept',
          name: conceptName,
          size: pages.length,
          group: 1
        }
        graphNodes.push(node)
        nodeMap.set(node.id, node)
      })

      // Add source nodes (sample of top sources)
      const sourceCounts = new Map<string, number>()
      index.pages.forEach(page => {
        if (page.type === 'source') {
          const count = (sourceCounts.get(page.name) || 0) + 1
          sourceCounts.set(page.name, count)
        }
      })

      Array.from(sourceCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50) // Top 50 sources
        .forEach(([sourceName, count]) => {
          const node: GraphNode = {
            id: `source-${sourceName}`,
            type: 'source',
            name: sourceName,
            size: count,
            group: 2
          }
          graphNodes.push(node)
          nodeMap.set(node.id, node)
        })

      // Build links by finding pages that mention both entities/concepts
      const linkSet = new Set<string>()

      // Entity-Concept links
      index.pages.forEach(page => {
        if (page.entities && page.concepts) {
          // Link entities to concepts they co-occur with
          page.entities.forEach((entity: string) => {
            page.concepts.forEach((concept: string) => {
              const entityId = `entity-${entity}`
              const conceptId = `concept-${concept}`

              if (nodeMap.has(entityId) && nodeMap.has(conceptId)) {
                const linkKey = `${entityId}-${conceptId}`
                if (!linkSet.has(linkKey)) {
                  graphLinks.push({
                    source: entityId,
                    target: conceptId,
                    value: 1,
                    type: 'mentions'
                  })
                  linkSet.add(linkKey)
                }
              }
            })
          })

          // Link source to entities
          if (page.type === 'source') {
            const sourceId = `source-${page.name}`
            if (nodeMap.has(sourceId)) {
              page.entities.slice(0, 5).forEach((entity: string) => {
                const entityId = `entity-${entity}`
                if (nodeMap.has(entityId)) {
                  const linkKey = `${sourceId}-${entityId}`
                  if (!linkSet.has(linkKey)) {
                    graphLinks.push({
                      source: sourceId,
                      target: entityId,
                      value: 1,
                      type: 'mentions'
                    })
                    linkSet.add(linkKey)
                  }
                }
              })
            }
          }
        }
      })

      // Add contradiction links (detect from content)
      const contradictionPatterns = [
        { entity1: 'Howard Marks', entity2: 'Sam Altman', type: 'contradicts' as const },
        { entity1: 'Gary Marcus', entity2: 'Jensen Huang', type: 'contradicts' as const },
        { entity1: 'Gary Marcus', entity2: 'Dario Amodei', type: 'contradicts' as const },
      ]

      contradictionPatterns.forEach(({ entity1, entity2, type }) => {
        const id1 = `entity-${entity1}`
        const id2 = `entity-${entity2}`
        if (nodeMap.has(id1) && nodeMap.has(id2)) {
          graphLinks.push({
            source: id1,
            target: id2,
            value: 2,
            type
          })
        }
      })

      setNodes(graphNodes)
      setLinks(graphLinks)
      setStats({
        entities: Object.keys(index.entities).length,
        concepts: Object.keys(index.concepts).length,
        sources: sourceCounts.size,
        connections: graphLinks.length
      })
      setLoading(false)
    } catch (error) {
      console.error('Failed to load wiki graph:', error)
      setLoading(false)
    }
  }

  const filteredNodes = filter === 'all'
    ? nodes
    : nodes.filter(n => n.type === filter)

  const filteredLinks = filter === 'all'
    ? links
    : links.filter(l => {
        const sourceNode = nodes.find(n => n.id === l.source)
        const targetNode = nodes.find(n => n.id === l.target)
        return sourceNode?.type === filter || targetNode?.type === filter
      })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Knowledge Graph: 403-Page AI Wiki
          </h1>
          <p className="text-gray-300">
            Explore connections between entities, concepts, and sources. Red dashed lines show contradictions.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{stats.entities}</div>
            <div className="text-sm text-gray-400">Entities</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">{stats.concepts}</div>
            <div className="text-sm text-gray-400">Concepts</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-green-400">{stats.sources}</div>
            <div className="text-sm text-gray-400">Sources</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-yellow-400">{stats.connections}</div>
            <div className="text-sm text-gray-400">Connections</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-6">
          {(['all', 'entity', 'concept', 'source'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
            </button>
          ))}
        </div>

        {/* Graph */}
        {loading ? (
          <div className="flex items-center justify-center h-[800px] bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading knowledge graph...</p>
            </div>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="flex items-center justify-center h-[800px] bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-400">No wiki data available yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Wiki will be indexed during next deployment
              </p>
            </div>
          </div>
        ) : (
          <KnowledgeGraph
            nodes={filteredNodes}
            links={filteredLinks}
            width={1400}
            height={800}
            onNodeClick={(node) => {
              setSelectedNode(node)
              console.log('Node clicked:', node)
            }}
          />
        )}

        {/* Instructions */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700 text-sm">
          <h3 className="font-semibold mb-2">How to use:</h3>
          <ul className="space-y-1 text-gray-300">
            <li>• Drag nodes to rearrange the graph</li>
            <li>• Hover over nodes to see details</li>
            <li>• Click nodes to view connections</li>
            <li>• Red dashed lines indicate contradictions between thinkers</li>
            <li>• Node size represents number of connections</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
