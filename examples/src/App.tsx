import React, { Fragment } from 'react'
import { Route, Link, Redirect, useLocation } from 'wouter'
import EvilCube from './demos/EvilCube'
import TakeControl from './demos/TakeControl'
import Bubbles from './demos/Bubbles'

const demos = [EvilCube, TakeControl, Bubbles]

const App = () => {
  const [loc] = useLocation()

  const demo = demos.find((d) => d.path === loc)

  return (
    <>
      <Route path="/">
        <Redirect to="/evil-cube" />
      </Route>

      {demo && (
        <>
          <Route path={demo.path}>
            <demo.component />
          </Route>
          <div id="desc">
            <h1>{demo.name}</h1>
            <p>{demo.description}</p>
          </div>
        </>
      )}
      <div id="controls">
        {demos.map((demo) => (
          <Link href={demo.path} key={demo.name}>
            <a>
              <div></div>
            </a>
          </Link>
        ))}
      </div>
    </>
  )
}

export default App
