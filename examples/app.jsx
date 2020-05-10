import React from 'react'
import { render } from 'react-dom'
import { Link, Route } from 'wouter'
import GlitchAndNoise from './pages/glitch-and-noise'
import './style.css'
import SSAOAndBloom from './pages/ssao-and-bloom'

const links = [
  {
    href: '/glitch-and-noise',
    text: 'Glitch and Noise',
  },
  {
    href: '/ssao-and-bloom',
    text: 'SSAO and Bloom',
  },
]

const App = () => (
  <div>
    <Link href="/">
      <a id="header">
        <h1>react-postprocessing examples</h1>
      </a>
    </Link>
    <nav>
      <Route path="/">
        {links.map(({ href, text }) => (
          <Link href={href} key={text}>
            {text}
          </Link>
        ))}
      </Route>
    </nav>

    <Route path="/glitch-and-noise" component={GlitchAndNoise} />
    <Route path="/ssao-and-bloom" component={SSAOAndBloom} />
  </div>
)

render(<App />, document.getElementById('app'))
