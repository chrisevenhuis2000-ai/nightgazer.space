'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        // Opmaak in app/globals.css (.fout-*): Tailwind 4 genereert in dit
        // project geen utility-klassen.
        <div className="fout-scherm" style={{ background: '#07080d' }}>
          <div className="fout-inhoud">
            <div style={{ fontSize: '3.75rem', lineHeight: 1, marginBottom: 24 }} aria-hidden>&#x2604;</div>
            <h1 className="fout-titel" style={{ fontSize: '1.5rem', color: '#dde2f0', marginBottom: 12 }}>
              Er ging iets mis
            </h1>
            <p className="fout-tekst" style={{ color: 'rgba(221, 226, 240, 0.6)' }}>
              Er is een onverwachte fout opgetreden. Probeer het opnieuw of kom later terug.
            </p>
            <button
              onClick={this.reset}
              className="fout-knop fout-knop--primair"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
