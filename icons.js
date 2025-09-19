// icons.js - Mapeamento de ícones para cada item de inspeção
const itemIcons = {
    // Documentação
    "CNH": "🪪",
    "CRLV": "📄",
    "Seguro Obrigatório": "📋",
    
    // Interior
    "Airbags": "💨",
    "Cinto de segurança": "🔐",
    "Sistema de som": "🔊",
    "Luzes de cortesia": "💡",
    "Painel e indicadores": "🚨",
    "Bancos": "💺",
    
    // Exterior
    "Para-choques": "🚘",
    "Lataria": "🚗",
    "Vidros e para-brisas": "🪟",
    "Faróis": "💡",
    "Luzes traseiras": "🔴",
    "Retrovisores": "👁️",
    
    // Motor
    "Nível de óleo": "🛢️",
    "Líquido de arrefecimento": "💧",
    "Correias e mangueiras": "🔄",
    "Bateria": "🔋",
    
    // Segurança
    "Extintor de incêndio": "🧯",
    "Triângulo de segurança": "⚠️",
    "Chave de roda": "🔧",
    "Macaco": "🔩",
    "Estepe": "🛞",
    
    // Rodas
    "Pneus (estado e calibragem)": "🛞",
    "Calotas ou rodas de liga leve": "⚙️",
    "Freios": "🛑"
};

const getIconForItem = (itemName) => {
    return itemIcons[itemName] || '📋';
}
