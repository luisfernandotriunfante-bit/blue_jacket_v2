import { MotorClientes } from './MotorClientes';
import { MotorProdutos } from './MotorProdutos';
import { MotorHistorico } from './MotorHistorico';

// Administração > Bases — cada motor de mesclagem/processamento de dados
// (Motor 1, Motor 2, ...) vive aqui como uma seção própria, na ordem em que
// foram criados. Os próximos motores entram abaixo do último, sem mexer no
// que já existe.
export function AdminBases() {
  return (
    <>
      {/* Motor 1 — Motor de Clientes */}
      <MotorClientes />
      {/* Motor 2 — Motor de Produtos */}
      <MotorProdutos />
      {/* Motor 3 — Motor Histórico */}
      <MotorHistorico />
    </>
  );
}
