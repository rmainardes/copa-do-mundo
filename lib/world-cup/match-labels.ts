export function translateMatchStage(stage: string) {
  switch (stage) {
    case "group":
      return "Fase de grupos";
    case "round_of_32":
      return "32 avos de final";
    case "round_of_16":
      return "Oitavas de final";
    case "quarter_final":
      return "Quartas de final";
    case "semi_final":
      return "Semifinal";
    case "third_place":
      return "Disputa de 3º lugar";
    case "final":
      return "Final";
    default:
      return stage;
  }
}

export function translateMatchStatus(status: string) {
  switch (status) {
    case "scheduled":
      return "Agendado";
    case "live":
      return "Ao vivo";
    case "finished":
      return "Finalizado";
    case "postponed":
      return "Adiado";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
}
