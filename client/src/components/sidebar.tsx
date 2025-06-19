import { Link, useLocation } from "wouter";
import { 
  Clock, 
  BarChart3, 
  Users, 
  Settings, 
  UserCheck, 
  PlusCircle, 
  ChartBar 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Serviços", href: "/services", icon: Settings },
  { name: "Consultores", href: "/consultants", icon: UserCheck },
  { name: "Lançamento de Horas", href: "/time-entries", icon: PlusCircle },
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
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                  <Icon className="h-5 w-5" />
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
