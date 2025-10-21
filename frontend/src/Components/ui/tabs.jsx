import React, { useState } from "react";

export const Tabs = ({ children }) => <div>{children}</div>;
export const TabsList = ({ children }) => <div className="flex gap-2">{children}</div>;
export const TabsTrigger = ({ children, onClick }) => (
  <button onClick={onClick} className="px-2 py-1 border rounded">
    {children}
  </button>
);
export const TabsContent = ({ children }) => <div className="mt-2">{children}</div>;

