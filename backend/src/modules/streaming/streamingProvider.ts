import {
  ContentDescriptor,
  StreamSource,
  PlaybackSession,
  NodeHealthStatus,
  StreamingProvider,
} from '../../../../src/types';
import { dbStore } from '../../db/store';

export class TorrServerStreamingProvider implements StreamingProvider {
  /**
   * Calculates Least-Loaded Routing coefficient K_load for an Edge node:
   * K_load = (active_streams / max_capacity * 0.5) + (cpu / 100 * 0.25) + (bandwidth / 1000 * 0.25)
   */
  static calculateLoadFactor(node: NodeHealthStatus): number {
    const streamRatio = node.activeStreams / node.maxCapacity;
    const cpuRatio = node.cpuUsagePercent / 100;
    const bwRatio = Math.min(1, node.bandwidthMbps / 1000);

    return parseFloat((streamRatio * 0.5 + cpuRatio * 0.25 + bwRatio * 0.25).toFixed(3));
  }

  /**
   * Selects the least loaded healthy edge node (K_load < 0.85)
   */
  static selectLeastLoadedNode(): NodeHealthStatus {
    const onlineNodes = dbStore.nodes.filter(n => n.isOnline);
    if (onlineNodes.length === 0) {
      throw new Error('No streaming nodes available online');
    }

    // Update load factors
    for (const node of onlineNodes) {
      node.loadFactor = this.calculateLoadFactor(node);
    }

    // Sort by load factor ascending
    onlineNodes.sort((a, b) => a.loadFactor - b.loadFactor);

    const bestNode = onlineNodes[0];
    if (bestNode.loadFactor >= 0.85) {
      console.warn(`[NodeBalancer] High load warning: Best node ${bestNode.nodeId} load factor is ${bestNode.loadFactor}`);
    }

    return bestNode;
  }

  async searchSources(content: ContentDescriptor): Promise<StreamSource[]> {
    // Generate sources based on content qualities (4K, 1080p, 720p)
    const sources: StreamSource[] = [];

    if (content.id.includes('4k') || content.title.includes('Дюна') || content.title.includes('Интерстеллар') || content.title.includes('Оппенгеймер')) {
      sources.push({
        id: `src-${content.id}-4k-hevc`,
        provider: 'torrserver',
        qualityLabel: '4k',
        resolution: '3840x2160',
        codec: 'hevc',
        hdr: true,
        bitrateBps: 25000000,
        sizeBytes: 42000000000,
        seeds: 184,
        locator: `magnet:?xt=urn:btih:4k_${content.id}_hevc_hdr`
      });
    }

    sources.push({
      id: `src-${content.id}-1080p-h264`,
      provider: 'torrserver',
      qualityLabel: '1080p',
      resolution: '1920x1080',
      codec: 'h264',
      hdr: false,
      bitrateBps: 8000000,
      sizeBytes: 12000000000,
      seeds: 340,
      locator: `magnet:?xt=urn:btih:1080p_${content.id}_h264`
    });

    sources.push({
      id: `src-${content.id}-720p-h264`,
      provider: 'torrserver',
      qualityLabel: '720p',
      resolution: '1280x720',
      codec: 'h264',
      hdr: false,
      bitrateBps: 3500000,
      sizeBytes: 4500000000,
      seeds: 120,
      locator: `magnet:?xt=urn:btih:720p_${content.id}_h264`
    });

    return sources;
  }

  async createSession(source: StreamSource, userId: string, targetNodeId?: string): Promise<PlaybackSession> {
    const node = targetNodeId
      ? dbStore.nodes.find(n => n.nodeId === targetNodeId) || TorrServerStreamingProvider.selectLeastLoadedNode()
      : TorrServerStreamingProvider.selectLeastLoadedNode();

    // Increment node active stream count
    node.activeStreams += 1;
    node.bandwidthMbps += Math.round(source.bitrateBps / 1000000);
    node.loadFactor = TorrServerStreamingProvider.calculateLoadFactor(node);

    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const sessionToken = `tok_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 6 * 3600 * 1000).toISOString();

    // The stream URL directs to our edge stream handler route
    const streamUrl = `/stream/play/${sessionId}?token=${sessionToken}`;

    const session: PlaybackSession = {
      sessionId,
      nodeId: node.nodeId,
      streamUrl,
      quality: source.qualityLabel,
      codec: source.codec,
      audioChannels: source.qualityLabel === '4k' ? 6 : 2,
      expiresAt
    };

    dbStore.sessions.push(session);
    return session;
  }

  async stopSession(sessionId: string): Promise<void> {
    const idx = dbStore.sessions.findIndex(s => s.sessionId === sessionId);
    if (idx !== -1) {
      const session = dbStore.sessions[idx];
      const node = dbStore.nodes.find(n => n.nodeId === session.nodeId);
      if (node) {
        node.activeStreams = Math.max(0, node.activeStreams - 1);
        node.bandwidthMbps = Math.max(0, node.bandwidthMbps - 10);
        node.loadFactor = TorrServerStreamingProvider.calculateLoadFactor(node);
      }
      dbStore.sessions.splice(idx, 1);
    }
  }

  async getNodeHealth(nodeId: string): Promise<NodeHealthStatus> {
    const node = dbStore.nodes.find(n => n.nodeId === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    node.loadFactor = TorrServerStreamingProvider.calculateLoadFactor(node);
    return node;
  }
}

export const streamingProvider = new TorrServerStreamingProvider();
