import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Network } from 'lucide-react';
import { Avatar } from '../../components/ui/avatar';
import { useEmployeesStore, type EmployeeWithCurrentAssignment } from './store';
import { Card } from '../../components/ui/card';
import { PageContainer, PageHeader, EmptyState, Skeleton } from '../../components/ui/page';

interface TreeNode {
  id: string;
  name: string;
  designation: string;
  children: TreeNode[];
}

// Built from the same employees list the Directory fetches — manager_id is already on each
// employee's current assignment. Employees with no manager (or a manager the RLS-scoped list
// doesn't contain) are roots.
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

  const rootManagerKeys = [...byManager.keys()].filter((k) => k === null || !knownIds.has(k));
  return rootManagerKeys.flatMap((k) => build(k));
}

function NodeCard({ node }: { node: TreeNode }) {
  return (
    <Link
      to={`/employees/${node.id}`}
      className="group inline-flex items-center gap-2.5 rounded-lg border border-default bg-surface-100 py-2 pl-2 pr-3 transition-colors hover:border-strong hover:bg-surface-200"
    >
      <Avatar name={node.name} size="sm" />
      <span className="leading-tight">
        <span className="block text-sm font-medium text-foreground group-hover:text-brand-link">{node.name}</span>
        <span className="block text-xs text-foreground-lighter">{node.designation}</span>
      </span>
      {node.children.length > 0 && (
        <span className="ml-1 rounded-full border border-default bg-surface-200 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-foreground-lighter">
          {node.children.length}
        </span>
      )}
    </Link>
  );
}

function TreeItem({ node }: { node: TreeNode }) {
  return (
    <li className="pt-3 first:pt-0">
      <NodeCard node={node} />
      {node.children.length > 0 && (
        <ul className="ml-[18px] mt-0 border-l border-border pl-5">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
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
    <PageContainer>
      <PageHeader title="Org Chart" description="Reporting relationships across your organisation, from live assignment data." />

      {loading && employees.length === 0 ? (
        <Card className="space-y-4 p-6">
          <Skeleton className="h-11 w-64" />
          <Skeleton className="ml-6 h-11 w-56" />
          <Skeleton className="ml-12 h-11 w-52" />
        </Card>
      ) : tree.length === 0 ? (
        <EmptyState
          icon={<Network className="h-5 w-5" />}
          title="No reporting structure yet"
          description="Once employees have managers assigned, their reporting tree will appear here."
        />
      ) : (
        <Card className="overflow-x-auto p-6">
          <ul className="space-y-4">
            {tree.map((node) => (
              <TreeItem key={node.id} node={node} />
            ))}
          </ul>
        </Card>
      )}
    </PageContainer>
  );
}
