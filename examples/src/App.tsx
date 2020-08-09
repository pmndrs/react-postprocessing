import React from 'react'
import cx from 'classnames'
import { HashRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import demos from './demos'
import { DemoWrapper, DemoPanel, Spot } from './styles'

const demosEntries = Object.entries(demos)
export default function App() {
  return (
    <Router>
      <Switch>
        {demosEntries.map(([name, { Component, bright }]) => (
          <Route path={`/demo/${name}`} key={name} exact>
            {({ match }) =>
              !!match && (
                <DemoWrapper className={cx({ bright })}>
                  <React.Suspense fallback={null}>
                    <Component />
                  </React.Suspense>
                </DemoWrapper>
              )
            }
          </Route>
        ))}

        {/* Redirect to the first example on 404 */}
        <Redirect to={`/demo/${demosEntries[0][0]}`} />
      </Switch>

      <DemoPanel>
        {demosEntries.map(([name, { bright }]) => (
          <Spot key={name} to={`/demo/${name}`} title={name} activeClassName="active" className={cx({ bright })} />
        ))}
      </DemoPanel>
    </Router>
  )
}
