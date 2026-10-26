export type AssetCategory =
  | "Laptop"
  | "Desktop"
  | "Server"
  | "Monitor"
  | "Network"
  | "Other";

export type AssetStatus =
  | "Available"
  | "Assigned"
  | "Maintenance"
  | "Retired";

export type Asset = {
  id: string;
  name: string;
  category: AssetCategory;
  serialNumber: string;
  status: AssetStatus;
  assignedTo: string;
  location: string;
  createdAt: string;
  updatedAt: string;
};

export const initialAssets: Asset[] = [
  {
    id: "AST-1001",
    name: "Dell Latitude 7440",
    category: "Laptop",
    serialNumber: "DL7440-001",
    status: "Assigned",
    assignedTo: "Olivia Chen",
    location: "New York Office",
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "AST-1002",
    name: "MacBook Pro 14",
    category: "Laptop",
    serialNumber: "MBP14-002",
    status: "Assigned",
    assignedTo: "James Wilson",
    location: "San Francisco Office",
    createdAt: "2026-10-02T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
  },
  {
    id: "AST-1003",
    name: "Dell PowerEdge R750",
    category: "Server",
    serialNumber: "PE750-003",
    status: "Maintenance",
    assignedTo: "",
    location: "Data Center A",
    createdAt: "2026-10-03T09:00:00.000Z",
    updatedAt: "2026-10-03T09:00:00.000Z",
  },
  {
    id: "AST-1004",
    name: "LG UltraFine 27",
    category: "Monitor",
    serialNumber: "LG27-004",
    status: "Available",
    assignedTo: "",
    location: "New York Office",
    createdAt: "2026-10-04T09:00:00.000Z",
    updatedAt: "2026-10-04T09:00:00.000Z",
  },
  {
    id: "AST-1005",
    name: "Cisco Catalyst 9200",
    category: "Network",
    serialNumber: "CC9200-005",
    status: "Available",
    assignedTo: "",
    location: "Data Center A",
    createdAt: "2026-10-05T09:00:00.000Z",
    updatedAt: "2026-10-05T09:00:00.000Z",
  },
];
