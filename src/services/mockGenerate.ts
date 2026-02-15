export function generateMockProject(idea: string) {
  const lowerIdea = idea.toLowerCase();

  if (lowerIdea.includes("حجز") || lowerIdea.includes("عيادة")) {
    return {
      name: "Clinic Management System",
      description: "نظام إدارة حجوزات ومرضى للعيادات",
      models: [
        {
          name: "Patients",
          fields: [
            { name: "name", type: "string" },
            { name: "phone", type: "string" },
          ],
        },
        {
          name: "Appointments",
          fields: [
            { name: "date", type: "date" },
            { name: "status", type: "string" },
          ],
        },
      ],
    };
  }

  if (lowerIdea.includes("متجر")) {
    return {
      name: "Ecommerce Dashboard",
      description: "لوحة إدارة متجر إلكتروني",
      models: [
        {
          name: "Products",
          fields: [
            { name: "name", type: "string" },
            { name: "price", type: "number" },
          ],
        },
        {
          name: "Orders",
          fields: [
            { name: "total", type: "number" },
            { name: "status", type: "string" },
          ],
        },
      ],
    };
  }

  return {
    name: "Custom Dashboard",
    description: "لوحة إدارة عامة",
    models: [
      {
        name: "Items",
        fields: [
          { name: "name", type: "string" },
          { name: "createdAt", type: "date" },
        ],
      },
    ],
  };
}