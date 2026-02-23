import { useEffect, useRef, useState } from 'react'
import { createStompClient, subscribeBlueprint } from './lib/stompClient.js'
import { createSocket } from './lib/socketIoClient.js'

import ActionBar from './components/ActionBar'
import AuthorPanel from './components/AuthorPanel'
import BlueprintCanvas from './components/BlueprintCanvas'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080' // Spring
const IO_BASE  = import.meta.env.VITE_IO_BASE  ?? 'http://localhost:3001' // Node/Socket.IO


export default function App() {
  const [tech, setTech] = useState('stomp')       
  const [author, setAuthor] = useState('juan')    // Autor 
  const [blueprints, setBlueprints] = useState([]) // Lista de planos del autor
  const [selectedBP, setSelectedBP] = useState(null) 
  const [points, setPoints] = useState([])        
  const [loading, setLoading] = useState(false)    

  const stompRef = useRef(null) 
  const socketRef = useRef(null) 
  const unsubFn = useRef(null)  

  const refreshBlueprints = async () => {
    setLoading(true)
    const base = tech === 'stomp' ? API_BASE : IO_BASE
    try {
      const res = await fetch(`${base}/api/v1/blueprints/${author}`)
      const json = await res.json()
      setBlueprints(json.data || [])
    } catch (e) { setBlueprints([]) }
    finally { setLoading(false) }
  }

  // Recarga los planos cada vez que cambia el autor o la tecnología RT.
  useEffect(() => { refreshBlueprints() }, [author, tech])

  useEffect(() => {
    if (unsubFn.current) unsubFn.current()
    if (stompRef.current) stompRef.current.deactivate()
    if (socketRef.current) socketRef.current.disconnect()

    setPoints([])
    if (!selectedBP) return

    const base = tech === 'stomp' ? API_BASE : IO_BASE
    
    fetch(`${base}/api/v1/blueprints/${author}/${selectedBP}`)
      .then(r => r.json())
      .then(json => {
        const data = json.data || json;
        setPoints(data.points || [])
      })

    if (tech === 'stomp') {
      const client = createStompClient(API_BASE)
      stompRef.current = client
      client.onConnect = () => {
        const sub = subscribeBlueprint(client, author, selectedBP, (d) => {
          if (d?.points) setPoints(d.points)
        })
        unsubFn.current = () => sub.unsubscribe()
      }
      client.activate()
    } else {
      const socket = createSocket(IO_BASE)
      socketRef.current = socket
      socket.connect()
      socket.emit('join-room', `${author}.${selectedBP}`)
      socket.on('blueprint-update', (d) => {
        if (d?.points) setPoints(prev => [...prev, ...d.points])
      })
      unsubFn.current = () => socket.disconnect()
    }
  }, [tech, author, selectedBP])

  /**
   * Dibuja los puntos
   * @param {number} x - Coordenada X relativa al canvas.
   * @param {number} y - Coordenada Y relativa al canvas.
   */
  const handleDraw = (x, y) => {
    if (!selectedBP) return
    const point = { x, y }
    setPoints(prev => [...prev, point])

    if (tech === 'stomp' && stompRef.current?.connected) {
      stompRef.current.publish({
        destination: '/app/draw',
        body: JSON.stringify({ author, name: selectedBP, point })
      })
    } else if (tech === 'socketio' && socketRef.current?.connected) {
      socketRef.current.emit('draw-event', {
        room: `${author}.${selectedBP}`, author, name: selectedBP, point
      })
    }
  }

  /**
   * Crea un nuevo plano vacío para el autor que este ahi
   * @param {string} name - Nombre del nuevo plano.
   */
  const handleCreate = async (name) => {
    const base = tech === 'stomp' ? API_BASE : IO_BASE
    try {
      const res = await fetch(`${base}/api/v1/blueprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, name, points: [] })
      })
      if (res.ok) {
        await refreshBlueprints()
        setSelectedBP(name)
      } else {
        alert("Error al crear el plano")
      }
    } catch (e) { alert("Error de red") }
  }

  //Elimina plano seleccionado
  const handleDelete = async () => {
    if (!selectedBP) return
    const base = tech === 'stomp' ? API_BASE : IO_BASE
    try {
      const res = await fetch(`${base}/api/v1/blueprints/${author}/${selectedBP}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setSelectedBP(null)
        refreshBlueprints()
      }
    } catch (e) { alert("Error al eliminar") }
  }
  return (
    <div style={{ padding: 25, maxWidth: 1100, margin: '0 auto', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 30,
          padding: '15px 20px',
          backgroundColor: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#333' }}>
          BluePrints RT
          <span style={{ fontWeight: 'normal', fontSize: '1rem', marginLeft: 10, color: '#666' }}>
            - Mode: {tech.toUpperCase()}
          </span>
        </h2>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={tech}
            onChange={e => { setTech(e.target.value); setSelectedBP(null) }}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.9rem' }}
          >
            <option value="stomp">STOMP (Spring)</option>
            <option value="socketio">Socket.IO (Node)</option>
          </select>

          <input
            value={author}
            onChange={e => { setAuthor(e.target.value); setSelectedBP(null) }}
            placeholder="Autor"
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.9rem', width: 150 }}
          />
        </div>
      </header>

      <div style={{ display: 'flex', gap: 20 }}>
        <AuthorPanel blueprints={blueprints} loading={loading} selected={selectedBP} onSelect={setSelectedBP} />
        <div style={{ flex: 1 }}>
          <ActionBar
            selected={selectedBP}
            onReload={refreshBlueprints}
            onCreate={handleCreate}
            onDelete={handleDelete}
          />
          <BlueprintCanvas points={points} onDraw={handleDraw} disabled={!selectedBP} />
        </div>
      </div>
    </div>
  )
}