import React from "react";
import { gql, useQuery } from "@apollo/client";
import { Chart } from "./Chart";
import * as Types from "./types";
import moment from "moment";

const TRANSACTIONS_QUERY = gql`
  query TransactionsQuery {
    transactions {
      id
      name
      amount
      date
      account {
        name
      }
    }
  }
`;

export const Spending: React.FC = () => {
  const { data, loading, error } = useQuery<Types.TransactionsQuery>(
    TRANSACTIONS_QUERY
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error.message}</div>;
  if (!data || !data.transactions) return <div>No transactions to show.</div>;

  const cache: { [day: string]: { sum: number; transactions: string[] } } = {};
  data?.transactions.forEach((t) => {
    if (!t.date || !t.amount) return;

    const day = cache[t.date] || { sum: 0, transactions: [] };
    day.transactions.push(`${t.name}: $${t.amount.toLocaleString()}`);
    day.sum = day.sum + t.amount;
    cache[t.date] = day;
  });

  return (
    <div>
      {data?.transactions && data?.transactions.length > 0 && (
        <Chart
          data={Object.entries(cache).map(([key, value]) => ({
            x: moment(key).toDate(),
            y: value.sum,
            label: value.transactions.join("\n"),
          }))}
        />
      )}
      <div style={{ marginTop: 20 }}>
        {data?.transactions?.map((t) => (
          <div key={t.id}>
            {t.date} –– {t.name}: {t.amount}
          </div>
        ))}
      </div>
    </div>
  );
};
