import { requireUser } from "@/lib/auth";
import { BudgetClient } from "@/modules/budget/components/budget-client";
import { IncomeClient } from "@/modules/income/components/income-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function BudgetIncomePage() {
  await requireUser();
  return (
    <div className="space-y-2 mt-2">
      <Tabs defaultValue="income" className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="income">Income Streams</TabsTrigger>
          <TabsTrigger value="budget">Monthly Budget</TabsTrigger>
        </TabsList>
        <TabsContent value="income" className="m-0">
          <IncomeClient />
        </TabsContent>
        <TabsContent value="budget" className="m-0">
          <BudgetClient />
        </TabsContent>
      </Tabs>
    </div>
  );
}
