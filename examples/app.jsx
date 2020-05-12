import React from 'react'
import { render } from 'react-dom'
import { Link, Route } from 'wouter'
import GlitchAndNoise from './pages/glitch-and-noise'
import './style.css'
import SSAOAndBloom from './pages/ssao-and-bloom'
import PixelationDemo from './pages/pixelation'

const links = [
  {
    href: '/glitch-and-noise',
    text: 'Glitch and Noise',
    component: GlitchAndNoise,
  },
  {
    href: '/ssao-and-bloom',
    text: 'SSAO and Bloom',
    component: SSAOAndBloom,
  },
  {
    href: '/pixelation',
    component: PixelationDemo,
    text: 'Pixelation',
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

    {links.map((link) => (
      <Route path={link.href} component={link.component} key={link.text} />
    ))}
  </div>
)

render(<App />, document.getElementById('app'))
