import { MotorClientes } from '../clientes/MotorClientes';

// Administração > Bases — cada motor de mesclagem/processamento de dados
// (Motor 1, Motor 2, ...) vive aqui como uma seção própria, na ordem em que
// foram criados. Por enquanto só existe o Motor 1 (Motor de Clientes); os
// próximos motores entram abaixo dele, sem mexer no que já existe.
export function AdminBases() {
  return (
    <>
      {/* Motor 1 — Motor de Clientes */}
      <MotorClientes />
    </>
  );
}
