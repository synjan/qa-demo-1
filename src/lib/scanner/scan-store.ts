import { ScanSession } from '@/lib/types'

// Simple in-memory store for MVP
// In production, this would be a database
class ScanStore {
  private scans: Map<string, ScanSession> = new Map()

  create(scan: ScanSession): void {
    this.scans.set(scan.id, scan)
  }

  get(id: string): ScanSession | undefined {
    return this.scans.get(id)
  }

  update(id: string, updates: Partial<ScanSession>): void {
    const scan = this.scans.get(id)
    if (scan) {
      this.scans.set(id, { ...scan, ...updates })
    }
  }

  getAll(): ScanSession[] {
    return Array.from(this.scans.values())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  }

  getUserScans(userEmail: string): ScanSession[] {
    // For MVP, return all scans
    // In production, filter by user
    return this.getAll()
  }
}

export const scanStore = new ScanStore()