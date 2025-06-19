import { Link, useLocation } from "wouter";
import { 
  Clock, 
  BarChart3, 
  Users, 
  Settings, 
  UserCheck, 
  PlusCircle, 
  ChartBar,
  CheckSquare,
  LucideIcon
} from "lucide-react";

type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon | null;
};

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Lançamento", href: "/time-entries", icon: PlusCircle },
  { name: "Manutenção", href: "/activities", icon: CheckSquare },
  { name: "separator", href: "", icon: null },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Serviços", href: "/services", icon: Settings },
  { name: "Consultores", href: "/consultants", icon: UserCheck },
  { name: "separator", href: "", icon: null },
  { name: "Relatórios", href: "/reports", icon: ChartBar },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 flex items-center">
          <Clock className="text-primary mr-2 h-6 w-6" />
          Gestão de Horas
        </h1>
      </div>
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {navigation.map((item, index) => {
            if (item.name === "separator") {
              return (
                <li key={`separator-${index}`} className="py-2">
                  <div className="border-t border-gray-200"></div>
                </li>
              );
            }
            
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                  {Icon ? <Icon className="h-5 w-5" /> : null}
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
