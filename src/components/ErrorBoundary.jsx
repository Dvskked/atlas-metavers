import { Component } from 'react'

export class ErrorBoundary extends Component {
    state = { error: null }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        console.error('[Atlas] error capturado:', error, info)
    }

    render() {
        if (this.state.error) return this.props.fallback ?? null
        return this.props.children
    }
}