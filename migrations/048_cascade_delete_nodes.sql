ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_parent_id_fkey;
ALTER TABLE nodes ADD CONSTRAINT nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE;
