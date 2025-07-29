import { getClient } from '../netlify/functions/db-client.js'
import { randomUUID } from 'crypto'

async function backfill() {
  const client = await getClient()
  try {
    const { rows } = await client.query(
      `SELECT id, parent_id, x, y FROM nodes WHERE (x = 0 OR x IS NULL) AND (y = 0 OR y IS NULL)`
    )
    console.log(`found ${rows.length} nodes to update`)
    for (const row of rows) {
      let x = row.x
      let y = row.y
      if (row.parent_id) {
        const parentRes = await client.query('SELECT x, y FROM nodes WHERE id=$1', [row.parent_id])
        const parent = parentRes.rows[0]
        const angle = Math.random() * 2 * Math.PI
        const distance = 200
        x = Math.round(parent.x + Math.cos(angle) * distance)
        y = Math.round(parent.y + Math.sin(angle) * distance)
      } else {
        x = row.x ?? 0
        y = row.y ?? 0
      }
      await client.query('UPDATE nodes SET x=$1, y=$2 WHERE id=$3', [x, y, row.id])
    }
  } finally {
    client.release()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  backfill().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
