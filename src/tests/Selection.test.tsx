import * as React from 'react'
import * as THREE from 'three'
import { afterEach, describe, expect, it } from 'vitest'
import { Select, Selection, selectionContext } from '../Selection'
import { flush, root } from './test-utils'

afterEach(async () => {
  await React.act(async () => {
    root.render(null)
  })
})

function Capture({ onSnapshot }: { onSnapshot: (selected: THREE.Object3D[]) => void }) {
  const api = React.useContext(selectionContext)
  React.useEffect(() => {
    onSnapshot(api?.selected ?? [])
  })
  return null
}

describe('Selection/Select', () => {
  it('settles to a stable selected array without looping', async () => {
    const snapshots: THREE.Object3D[][] = []
    const meshRef = React.createRef<THREE.Mesh>()

    await React.act(async () =>
      root.render(
        <Selection>
          <Capture onSnapshot={(s) => snapshots.push(s)} />
          <Select enabled>
            <mesh ref={meshRef}>
              <boxGeometry />
              <meshBasicMaterial />
            </mesh>
          </Select>
        </Selection>
      )
    )
    await flush()
    await flush()

    // Exactly one render for the initial (empty) commit, one for the
    // single necessary addition - the original bug kept re-triggering
    // itself, so this would grow unbounded (and eventually throw) instead
    // of stopping at 2.
    expect(snapshots).toEqual([[], [meshRef.current]])
  })

  it('selects a Line and a Points object, not just Mesh', async () => {
    const snapshots: THREE.Object3D[][] = []
    const lineRef = React.createRef<THREE.Line>()
    const pointsRef = React.createRef<THREE.Points>()

    await React.act(async () =>
      root.render(
        <Selection>
          <Capture onSnapshot={(s) => snapshots.push(s)} />
          <Select enabled>
            <threeLine ref={lineRef}>
              <bufferGeometry />
              <lineBasicMaterial />
            </threeLine>
          </Select>
          <Select enabled>
            <points ref={pointsRef}>
              <bufferGeometry />
              <pointsMaterial />
            </points>
          </Select>
        </Selection>
      )
    )
    await flush()
    await flush()

    const last = snapshots[snapshots.length - 1]
    expect(last).toContain(lineRef.current)
    expect(last).toContain(pointsRef.current)
  })

  it('removes its objects once unmounted, leaving a sibling Select untouched', async () => {
    const snapshots: THREE.Object3D[][] = []
    const meshARef = React.createRef<THREE.Mesh>()
    const meshBRef = React.createRef<THREE.Mesh>()

    const render = (mountA: boolean) =>
      root.render(
        <Selection>
          <Capture onSnapshot={(s) => snapshots.push(s)} />
          {mountA && (
            <Select key="a" enabled>
              <mesh ref={meshARef}>
                <boxGeometry />
                <meshBasicMaterial />
              </mesh>
            </Select>
          )}
          <Select key="b" enabled>
            <mesh ref={meshBRef}>
              <boxGeometry />
              <meshBasicMaterial />
            </mesh>
          </Select>
        </Selection>
      )

    await React.act(async () => render(true))
    await flush()
    await flush()
    expect(snapshots[snapshots.length - 1]).toEqual(expect.arrayContaining([meshARef.current, meshBRef.current]))

    await React.act(async () => render(false))
    await flush()
    await flush()

    const last = snapshots[snapshots.length - 1]
    expect(last).not.toContain(meshARef.current)
    expect(last).toContain(meshBRef.current)
  })

  it('removes its objects when enabled toggles to false', async () => {
    const snapshots: THREE.Object3D[][] = []
    const meshRef = React.createRef<THREE.Mesh>()

    const render = (enabled: boolean) =>
      root.render(
        <Selection>
          <Capture onSnapshot={(s) => snapshots.push(s)} />
          <Select enabled={enabled}>
            <mesh ref={meshRef}>
              <boxGeometry />
              <meshBasicMaterial />
            </mesh>
          </Select>
        </Selection>
      )

    await React.act(async () => render(true))
    await flush()
    await flush()
    expect(snapshots[snapshots.length - 1]).toContain(meshRef.current)

    await React.act(async () => render(false))
    await flush()
    await flush()
    expect(snapshots[snapshots.length - 1]).not.toContain(meshRef.current)
  })

  it('selects a SkinnedMesh - isMesh is inherited, not just the exact type string', async () => {
    const snapshots: THREE.Object3D[][] = []
    const meshRef = React.createRef<THREE.SkinnedMesh>()

    await React.act(async () =>
      root.render(
        <Selection>
          <Capture onSnapshot={(s) => snapshots.push(s)} />
          <Select enabled>
            <skinnedMesh ref={meshRef} />
          </Select>
        </Selection>
      )
    )
    await flush()
    await flush()

    expect(snapshots[snapshots.length - 1]).toContain(meshRef.current)
  })

  it('does not duplicate an object claimed by nested Selects', async () => {
    const snapshots: THREE.Object3D[][] = []
    const meshRef = React.createRef<THREE.Mesh>()

    await React.act(async () =>
      root.render(
        <Selection>
          <Capture onSnapshot={(s) => snapshots.push(s)} />
          <Select enabled>
            <Select enabled>
              <mesh ref={meshRef}>
                <boxGeometry />
                <meshBasicMaterial />
              </mesh>
            </Select>
          </Select>
        </Selection>
      )
    )
    await flush()
    await flush()
    await flush()

    const last = snapshots[snapshots.length - 1]
    expect(last.filter((o) => o === meshRef.current)).toHaveLength(1)
  })

  it('keeps an object selected via the outer Select after the inner one disables', async () => {
    const snapshots: THREE.Object3D[][] = []
    const meshRef = React.createRef<THREE.Mesh>()

    const render = (innerEnabled: boolean) =>
      root.render(
        <Selection>
          <Capture onSnapshot={(s) => snapshots.push(s)} />
          <Select enabled>
            <Select enabled={innerEnabled}>
              <mesh ref={meshRef}>
                <boxGeometry />
                <meshBasicMaterial />
              </mesh>
            </Select>
          </Select>
        </Selection>
      )

    await React.act(async () => render(true))
    await flush()
    await flush()
    await flush()
    expect(snapshots[snapshots.length - 1]).toContain(meshRef.current)

    await React.act(async () => render(false))
    await flush()
    await flush()
    await flush()

    // The inner Select's own cleanup drops its claim, but the mesh never
    // left the outer Select's subtree - its own traversal still finds it.
    expect(snapshots[snapshots.length - 1]).toContain(meshRef.current)
  })

  it('does not change the selected array reference on a re-render where children only changes identity', async () => {
    const refs: THREE.Object3D[][] = []
    const meshRef = React.createRef<THREE.Mesh>()

    function CaptureRef() {
      const api = React.useContext(selectionContext)
      React.useEffect(() => {
        if (api) refs.push(api.selected)
      })
      return null
    }

    // A fresh JSX tree every call, like a parent re-rendering for an
    // unrelated reason - Select's own `children` prop is a new reference
    // each time even though the underlying mesh never changes.
    const render = () =>
      root.render(
        <Selection>
          <CaptureRef />
          <Select enabled>
            <mesh ref={meshRef}>
              <boxGeometry />
              <meshBasicMaterial />
            </mesh>
          </Select>
        </Selection>
      )

    await React.act(async () => render())
    await flush()
    await flush()

    refs.length = 0
    for (let i = 0; i < 5; i++) {
      await React.act(async () => render())
      await flush()
    }

    expect(new Set(refs).size).toBe(1)
  })

  it('a cleanup updater returns the same reference when nothing is left for it to remove', async () => {
    const meshRef = React.createRef<THREE.Mesh>()
    const updaters: Array<(prev: THREE.Object3D[]) => THREE.Object3D[]> = []

    // React batches both nested Selects' cleanup calls into a single
    // re-render regardless of this bail-out (the net change from mount to
    // unmount is real), so the optimization isn't observable through
    // rendering alone. Capture the raw updater functions instead and
    // replay them directly to verify the second one bails.
    function CapturingSelection({ children }: { children: React.ReactNode }) {
      const [selected, setSelected] = React.useState<THREE.Object3D[]>([])
      const select = React.useCallback((updater: React.SetStateAction<THREE.Object3D[]>) => {
        if (typeof updater === 'function') updaters.push(updater as (prev: THREE.Object3D[]) => THREE.Object3D[])
        setSelected(updater)
      }, [])
      const value = React.useMemo(() => ({ selected, select, enabled: true }), [selected, select])
      return <selectionContext.Provider value={value}>{children}</selectionContext.Provider>
    }

    const render = (mounted: boolean) =>
      root.render(
        <CapturingSelection>
          {mounted && (
            <Select enabled>
              <Select enabled>
                <mesh ref={meshRef}>
                  <boxGeometry />
                  <meshBasicMaterial />
                </mesh>
              </Select>
            </Select>
          )}
        </CapturingSelection>
      )

    await React.act(async () => render(true))
    await flush()
    await flush()
    await flush()

    const mesh = meshRef.current!
    updaters.length = 0
    await React.act(async () => render(false))
    await flush()
    await flush()
    await flush()

    expect(updaters).toHaveLength(2)
    const afterFirst = updaters[0]([mesh])
    const afterSecond = updaters[1](afterFirst)
    expect(afterSecond).toBe(afterFirst)
  })
})
