import styled, { createGlobalStyle } from 'styled-components'
import { NavLink } from 'react-router-dom'

export const Page = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;

  & > h1 {
    font-family: 'Roboto', sans-serif;
    font-weight: 900;
    font-size: 8em;
    margin: 0;
    color: white;
    line-height: 0.59em;
    letter-spacing: -2px;
  }

  @media only screen and (max-width: 1000px) {
    & > h1 {
      font-size: 5em;
      letter-spacing: -1px;
    }
  }

  & > a {
    margin: 0;
    color: white;
    text-decoration: none;
  }
`

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: inherit;
  }

  html {
    box-sizing: border-box;
    height: 100vh;
    overflow: hidden;
    font-size: 16px;

    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  html,
  body,
  #root,
  #root > div:first-child {
    height: 100%;
  }

  body {
    margin: 0;
    padding: 0;
    width: 100%;
    position: fixed;
    font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica, ubuntu, roboto, noto, segoe ui, arial, sans-serif;
    color: black;
    background: white;
  }
`

export const DemoWrapper = styled.div`
  width: 100%;
  height: 100%;

  &,
  canvas {
    background-color: black;
  }

  &.bright {
    &,
    canvas {
      background-color: white;
    }
  }
`

export const DemoPanel = styled.div`
  position: absolute;
  bottom: 50px;
  left: 50px;
  max-width: 250px;
`

export const Spot = styled(NavLink)`
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin: 8px;

  background-color: white;

  &.bright {
    background-color: #2c2d31;
  }

  &.active {
    background-color: salmon;
  }
`
export const LoadingMsg = styled.span`
  font-family: 'Inter', sans-serif;
  color: white;
  font-weight: 900;
  font-size: 48px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`
