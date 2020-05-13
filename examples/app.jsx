import React from 'react'
import { render } from 'react-dom'
import { Link, Route } from 'wouter'
import GlitchAndNoise from './pages/glitch-and-noise'
import './style.css'
import SSAOAndBloom from './pages/ssao-and-bloom'
import PixelationDemo from './pages/pixelation'
import SepiaVignette from './pages/sepia-vignette'
import TextureDemo from './pages/texture'

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
  {
    href: '/sepia-vignette-texture',
    component: SepiaVignette,
    text: 'Sepia and Vignette',
  },
  {
    href: '/texture',
    component: TextureDemo,
    text: 'Texture',
  },
]

const App = () => (
  <div>
    <div id="menu">
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
    </div>

    {links.map((link) => (
      <Route path={link.href} component={link.component} key={link.text} />
    ))}
  </div>
)

render(<App />, document.getElementById('app'))
