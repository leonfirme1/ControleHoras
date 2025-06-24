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
  Building,
  HeadphonesIcon,
  LucideIcon,
  X
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";

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
  { name: "Setor", href: "/sectors", icon: Building },
  { name: "Tipo Atendimento", href: "/service-types", icon: HeadphonesIcon },
  { name: "separator", href: "", icon: null },
  { name: "Relatórios", href: "/reports", icon: ChartBar },
];

export function Sidebar() {
  const [location] = useLocation();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={close}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${!isOpen ? 'lg:-translate-x-full' : ''}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 flex items-center">
            <Clock className="text-primary mr-2 h-6 w-6" />
            <span className="truncate">Gestão de Horas</span>
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={close}
            title="Fechar menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="mt-6 pb-6 overflow-y-auto">
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
                  <Link 
                    href={item.href} 
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      // Close sidebar on mobile when navigating
                      if (window.innerWidth < 1024) {
                        close();
                      }
                    }}
                  >
                    {Icon ? <Icon className="h-5 w-5 flex-shrink-0" /> : null}
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
