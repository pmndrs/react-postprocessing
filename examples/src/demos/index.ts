import { lazy } from 'react'

export default {
  TakeControl: { descr: '', tags: [], bright: false, Component: lazy(async () => await import('./TakeControl')) },
  Bubbles: { descr: '', tags: [], bright: false, Component: lazy(async () => await import('./Bubbles')) },
}
