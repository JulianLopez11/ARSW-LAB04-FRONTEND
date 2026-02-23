export default function ActionBar({ selected, onCreate, onReload, onDelete }) {
  const handleCreate = async () => {
    const name = window.prompt('Nombre del nuevo plano:');
    if (name?.trim()) onCreate(name.trim()).catch(e => alert("Error: " + e.message));
  };

  return (
    <div style={styles.bar}>
      <button style={styles.btnPrimary} onClick={handleCreate}>+ Nuevo</button>
      <button style={styles.btnSecondary} onClick={onReload} disabled={!selected}>Actualizar</button>
      <button style={styles.btnDanger} onClick={onDelete} disabled={!selected}>Borrar</button>
      
      {selected ? (
        <span style={styles.status}>• Editando: <strong>{selected}</strong></span>
      ) : (
        <span style={styles.status}>Selecciona un plano para comenzar</span>
      )}
    </div>
  );
}

const styles = {
  bar: { display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0' },
  btnPrimary: { padding: '6px 16px', borderRadius: 6, border: '1px solid #2b6cb0', background: '#ebf8ff', color: '#2b6cb0', cursor: 'pointer', fontWeight: 500 },
  btnSecondary: { padding: '6px 16px', borderRadius: 6, border: '1px solid #cbd5e0', background: '#fff', cursor: 'pointer' },
  btnDanger: { padding: '6px 16px', borderRadius: 6, border: '1px solid #e53e3e', background: '#fff', color: '#e53e3e', cursor: 'pointer' },
  status: { fontSize: 13, color: '#4a5568', marginLeft: 10 }
};