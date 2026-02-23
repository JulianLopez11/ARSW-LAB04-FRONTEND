import { useEffect, useRef, useState } from 'react'
import { createStompClient, subscribeBlueprint } from './lib/stompClient.js'
import { createSocket } from './lib/socketIoClient.js'

import ActionBar from './components/ActionBar'
import AuthorPanel from './components/AuthorPanel'
import BlueprintCanvas from './components/BlueprintCanvas'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'
const IO_BASE  = import.meta.env.VITE_IO_BASE  ?? 'http://localhost:3001'

export default function App() {
  const [tech, setTech] = useState('stomp')
  const [author, setAuthor] = useState('juan')
  const [blueprints, setBlueprints] = useState([])
  const [selectedBP, setSelectedBP] = useState(null)
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const stompRef = useRef(null)
  const socketRef = useRef(null)
  const unsubFn = useRef(null)

  // Planos asociados a autor
  const refreshBlueprints = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${tech === 'stomp' ? API_BASE : IO_BASE}/api/v1/blueprints/${author}`)
      const json = await res.json()
      if (res.ok && json.data) setBlueprints(json.data)
      else setBlueprints([])
    } catch (err) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshBlueprints()
  }, [author, tech])

  useEffect(() => {
    if (typeof unsubFn.current === 'function') unsubFn.current()
    unsubFn.current = null

    if (stompRef.current) {
      stompRef.current.deactivate()
      stompRef.current = null
    }

    setPoints([])
    if (!selectedBP) return
    //fetchhh
    fetch(`${API_BASE}/api/v1/blueprints/${author}/${selectedBP}`)
      .then(r => r.json())
      .then(json => {
        if (json?.data?.points) setPoints(json.data.points)
      })

    if (tech === 'stomp') {
      const client = createStompClient(API_BASE)
      stompRef.current = client
      
      client.onConnect = () => {
        console.log("Conectado a STOMP");
        const subscription = subscribeBlueprint(client, author, selectedBP, (updatedBp) => {
          console.log("Actualización recibida:", updatedBp);
          if (updatedBp && updatedBp.points) {
            setPoints([...updatedBp.points]); 
          }
        })
        unsubFn.current = () => subscription.unsubscribe()
      }
      client.activate()
    }

    return () => {
      if (typeof unsubFn.current === 'function') unsubFn.current()
      stompRef.current?.deactivate()
    }
  }, [tech, author, selectedBP])

  //Envío de dibujos al servidor
  const handleDraw = (x, y) => {
    if (!selectedBP) return
    const point = { x, y }
    setPoints(prev => [...prev, point])

    if (tech === 'stomp' && stompRef.current?.connected) {
      stompRef.current.publish({
        destination: '/app/draw', 
        body: JSON.stringify({ author, name: selectedBP, point })
      })
    }
  }

  const handleCreate = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/blueprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, name, points: [] })
      })
      if (res.ok) {
        await refreshBlueprints()
        setSelectedBP(name)
      } else {
        const err = await res.json()
        alert(err.message || "No se pudo crear")
      }
    } catch (e) { alert("Error de red") }
  }

  const handleDelete = async () => {
    const res = await fetch(`${API_BASE}/api/v1/blueprints/${author}/${selectedBP}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      setSelectedBP(null)
      refreshBlueprints()
    }
  }

  return (
    <div style={{
      padding: 24,
      maxWidth: 1000,
      margin: '40px auto',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      backgroundColor: '#f9f9f9',
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: 16,
        marginBottom: 20
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>BluePrints RT</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={tech}
            onChange={e => setTech(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              transition: '0.2s all'
            }}
          >
            <option value="stomp">STOMP (Spring)</option>
            <option value="socketio">Socket.IO</option>
          </select>

          <input
            value={author}
            onChange={e => { setAuthor(e.target.value); setSelectedBP(null); }}
            placeholder="Autor"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ccc',
              fontSize: 14,
              width: 150,
              transition: '0.2s all'
            }}
          />
        </div>
      </header>

      <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
        <aside style={{ width: 220 }}>
          <AuthorPanel
            blueprints={blueprints}
            loading={loading}
            error={error}
            selected={selectedBP}
            onSelect={setSelectedBP}
          />
        </aside>

        <main style={{ flex: 1 }}>
          <ActionBar
            selected={selectedBP}
            onCreate={handleCreate}
            onDelete={handleDelete}
            onReload={refreshBlueprints}
          />
          <BlueprintCanvas
            points={points}
            onDraw={handleDraw}
            disabled={!selectedBP}
          />
        </main>
      </div>
    </div>
  )
}