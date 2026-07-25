import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEmployeesStore, type EmployeeWithCurrentAssignment } from './store';

interface TreeNode {
  id: string;
  name: string;
  designation: string;
  children: TreeNode[];
}

// Employee Master backlog: "Basic org chart view | Manager -> reports tree, from live
// assignment data." Built from the same employees list the Directory already fetches — no new
// query needed, manager_id is already on each employee's current assignment. Employees with no
// manager (or a manager the RLS-scoped list doesn't contain, e.g. left the company) are roots.
function buildTree(employees: EmployeeWithCurrentAssignment[]): TreeNode[] {
  const byManager = new Map<string | null, EmployeeWithCurrentAssignment[]>();
  for (const emp of employees) {
    const managerId = emp.employment_assignments[0]?.manager_id ?? null;
    if (!byManager.has(managerId)) byManager.set(managerId, []);
    byManager.get(managerId)!.push(emp);
  }
  const knownIds = new Set(employees.map((e) => e.id));

  const build = (managerId: string | null): TreeNode[] =>
    (byManager.get(managerId) ?? []).map((emp) => ({
      id: emp.id,
      name: emp.legal_name,
      designation: emp.employment_assignments[0]?.designations?.title ?? '—',
      children: build(emp.id),
    }));

  // Roots = no manager, or a manager_id that isn't any employee in this list.
  const rootManagerKeys = [...byManager.keys()].filter((k) => k === null || !knownIds.has(k));
  return rootManagerKeys.flatMap((k) => build(k));
}

function TreeItem({ node, depth }: { node: TreeNode; depth: number }) {
  return (
    <div className="mt-2" style={{ marginLeft: depth * 24 }}>
      <Link to={`/employees/${node.id}`} className="text-selected hover:underline">
        {node.name}
      </Link>
      <span className="ml-2 text-text-subtle">{node.designation}</span>
      {node.children.map((child) => (
        <TreeItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function OrgChart() {
  const { employees, loading, fetchEmployees } = useEmployeesStore();

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tree = buildTree(employees);

  return (
    <div className="mx-auto max-w-[864px] p-6">
      <h1 className="mb-6 text-2xl font-medium text-foreground">Org chart</h1>

      {loading && <p className="text-text-subtle">Loading…</p>}
      {!loading && tree.length === 0 && <p className="text-text-subtle">No employees yet.</p>}
      {tree.map((node) => (
        <TreeItem key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}
