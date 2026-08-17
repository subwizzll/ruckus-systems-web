import type { BookingModalService } from '@workspace/scheduling-astro'
import catalog from '../data/services.json'

export function catalogServicesToModalMap(): Record<string, BookingModalService> {
  const services = catalog as BookingModalService[]
  return Object.fromEntries(services.map((service) => [service.id, service]))
}
