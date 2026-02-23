export default function AuthorPanel({ blueprints, loading, error, selected, onSelect }) {

  if (error) return <p style={styles.error}>Ocurrió un error: {error}</p>;
  if (!blueprints.length) return <p style={styles.info}>No hay planos disponibles.</p>;

  return (
    <div style={styles.list}>
      <h4 style={styles.title}>Tus Planos</h4>
      {blueprints.map((bp) => (
        <div
          key={bp.name}
          onClick={() => onSelect(bp.name)}
          style={{
            ...styles.item,
            color: selected === bp.name ? '#2b6cb0' : '#4a5568',
            background: selected === bp.name ? '#edf2f7' : 'transparent',
            fontWeight: selected === bp.name ? 'bold' : 'normal',
          }}
        >
          {bp.name}
        </div>
      ))}
    </div>
  );
}

const styles = {
  list: { border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#fff' },
  title: { margin: '0 0 10px 8px', fontSize: 14, color: '#a0aec0', textTransform: 'uppercase' },
  item: { padding: '10px 12px', cursor: 'pointer', borderRadius: 6, fontSize: 14, transition: 'all 0.2s' },
  info: { color: '#718096', fontSize: 13, textAlign: 'center' },
  error: { color: '#e53e3e', fontSize: 13 }
};