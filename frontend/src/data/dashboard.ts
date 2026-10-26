export type Ticket = {
  id: string;
  title: string;
  description?: string;
  requester: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  assignee: string;
  updated: string;
  createdAt?: string;
  updatedAt?: string;
};

export const tickets: Ticket[] = [
  { id: "INC-1042", title: "VPN connection fails after update", requester: "Olivia Chen", priority: "Critical", status: "Open", assignee: "James Wilson", updated: "5 min ago" },
  { id: "INC-1041", title: "Unable to access company email", requester: "Noah Williams", priority: "High", status: "In Progress", assignee: "Sophia Lee", updated: "18 min ago" },
  { id: "INC-1040", title: "Laptop running unusually slow", requester: "Emma Davis", priority: "Medium", status: "Open", assignee: "Unassigned", updated: "42 min ago" },
  { id: "INC-1039", title: "Request for software installation", requester: "Liam Brown", priority: "Low", status: "Resolved", assignee: "James Wilson", updated: "1 hour ago" },
  { id: "INC-1038", title: "Shared drive access denied", requester: "Ava Martinez", priority: "High", status: "In Progress", assignee: "Sophia Lee", updated: "2 hours ago" },
];

export const ticketTrends = [
  { day: "Mon", created: 28, resolved: 22 },
  { day: "Tue", created: 35, resolved: 29 },
  { day: "Wed", created: 31, resolved: 27 },
  { day: "Thu", created: 42, resolved: 35 },
  { day: "Fri", created: 38, resolved: 32 },
  { day: "Sat", created: 19, resolved: 24 },
  { day: "Sun", created: 25, resolved: 28 },
];
