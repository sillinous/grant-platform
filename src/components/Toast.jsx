import React from 'react';
import { T } from '../globals';

export const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div style={{
      position:"fixed", bottom:32, right:32, padding:"12px 24px",
      borderRadius:8, background: toast.type==="error" ? T.red : toast.type==="success" ? T.green : T.amber,
      color:"#fff", fontSize:13, fontWeight:600, zIndex:99999,
      animation:"fadeIn .3s", boxShadow:"0 4px 12px rgba(0,0,0,.3)",
    }}>
      {toast.msg}
    </div>
  );
};
