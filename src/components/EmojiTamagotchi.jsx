import React, { useState, useEffect, useCallback } from 'react';
import './EmojiTamagotchi.css'; // Import CSS file

const EmojiTamagotchi = () => {
  // Estados do Tamagotchi
  const [stats, setStats] = useState({
    hunger: 100,
    happiness: 100,
    energy: 100,
    health: 100,
    age: 0,
    cleanliness: 100,
    discipline: 50,
  });
  
  const [state, setState] = useState({
    isAlive: true,
    stage: 'egg', // egg, baby, child, teen, adult
    mood: 'normal', // normal, happy, sad, sick, sleeping
    isAnimating: false,
    lastAction: '',
    isDayTime: true,
  });
  
  // Toast notification state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
  });
  
  const [gameTime, setGameTime] = useState({
    lastTick: Date.now(),
    totalTime: 0,
    gameSpeed: 1, // multiplicador de velocidade
    paused: false,
  });
  
  // Emojis para cada estágio e humor
  const emojis = {
    egg: { normal: '🥚', happy: '🥚', sad: '🥚', sick: '🥚', sleeping: '💤🥚' },
    baby: { normal: '👶', happy: '😊', sad: '😢', sick: '🤒', sleeping: '💤👶' },
    child: { normal: '🧒', happy: '😄', sad: '😭', sick: '🤢', sleeping: '💤🧒' },
    teen: { normal: '👦', happy: '😁', sad: '😔', sick: '🤮', sleeping: '💤👦' },
    adult: { normal: '🧑', happy: '😎', sad: '😫', sick: '🥵', sleeping: '💤🧑' },
  };
  
  // Efeitos de animação
  const [animation, setAnimation] = useState({
    bounce: false,
    shake: false,
    fade: false,
    spin: false,
  });
  
  // Histórico de eventos
  const [eventLog, setEventLog] = useState([]);
  const addEvent = (event) => {
    const timestamp = new Date().toLocaleTimeString();
    setEventLog(prev => {
      const newLog = [{time: timestamp, text: event}, ...prev];
      return newLog.slice(0, 5); // Manter apenas os 5 eventos mais recentes
    });
  };

  // Sistema de progressão de idade/estágio
  const updateStage = useCallback(() => {
    const { age } = stats;
    let newStage = state.stage;
    
    if (age >= 20) newStage = 'adult';
    else if (age >= 10) newStage = 'teen';
    else if (age >= 5) newStage = 'child';
    else if (age >= 1) newStage = 'baby';
    
    if (newStage !== state.stage) {
      setState(prev => ({ ...prev, stage: newStage }));
      addEvent(`Seu pet evoluiu para o estágio: ${newStage}!`);
      triggerAnimation('bounce');
      showToast(`Seu pet evoluiu para o estágio: ${newStage}!`);
    }
  }, [stats.age, state.stage]);
  
  // Sistema de humor
  const updateMood = useCallback(() => {
    const { hunger, happiness, energy, health } = stats;
    let newMood = 'normal';
    
    if (state.mood === 'sleeping') return; // Não alterar se estiver dormindo
    
    if (health < 30) {
      newMood = 'sick';
    } else if (hunger < 30 || happiness < 30) {
      newMood = 'sad';
    } else if (happiness > 80 && energy > 50) {
      newMood = 'happy';
    }
    
    if (newMood !== state.mood) {
      setState(prev => ({ ...prev, mood: newMood }));
    }
  }, [stats, state.mood]);
  
  // Função de animação
  const triggerAnimation = (type) => {
    setAnimation(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setAnimation(prev => ({ ...prev, [type]: false }));
    }, 600);
  };
  
  // Show toast notification
  const showToast = (message) => {
    setToast({
      visible: true,
      message: message
    });
    
    // Auto hide toast after 2 seconds
    setTimeout(() => {
      setToast({
        visible: false,
        message: ''
      });
    }, 2000);
  };
  
  // Game loop principal
  useEffect(() => {
    if (state.isAlive && !gameTime.paused) {
      const gameLoop = setInterval(() => {
        const currentTime = Date.now();
        const deltaTime = (currentTime - gameTime.lastTick) * gameTime.gameSpeed;
        
        setGameTime(prev => ({
          ...prev,
          lastTick: currentTime,
          totalTime: prev.totalTime + deltaTime
        }));
        
        // Atualiza o ciclo dia/noite (a cada 5 minutos de tempo de jogo)
        if (Math.floor(gameTime.totalTime / 300000) !== 
            Math.floor((gameTime.totalTime + deltaTime) / 300000)) {
          setState(prev => ({ 
            ...prev, 
            isDayTime: !prev.isDayTime 
          }));
          const message = state.isDayTime ? "Anoiteceu!" : "Amanheceu!";
          addEvent(message);
          showToast(message);
        }
        
        // Atualiza estatísticas
        updateStats(deltaTime);
      }, 1000); // Atualiza a cada segundo
      
      return () => clearInterval(gameLoop);
    }
  }, [state.isAlive, gameTime.paused, gameTime.lastTick]);
  
  // Atualiza estatísticas baseado no tempo
  const updateStats = (deltaTime) => {
    setStats(prev => {
      // Taxa de diminuição base por segundo (ms * fator)
      const hungerRate = state.mood === 'sleeping' ? 0.0004 : 0.001;
      const happinessRate = 0.0005;
      const energyRate = state.mood === 'sleeping' ? -0.001 : 0.0008; // recupera energia dormindo
      const cleanlinessRate = 0.0003;
      
      // Calcular novos valores
      const newHunger = Math.max(0, prev.hunger - hungerRate * deltaTime);
      const newHappiness = Math.max(0, prev.happiness - happinessRate * deltaTime);
      const newEnergy = Math.max(0, prev.energy - energyRate * deltaTime);
      const newCleanliness = Math.max(0, prev.cleanliness - cleanlinessRate * deltaTime);
      
      // Verificando a saúde baseada nos outros atributos
      let healthImpact = 0;
      if (newHunger < 20) healthImpact += 0.001 * deltaTime;
      if (newHappiness < 20) healthImpact += 0.0005 * deltaTime;
      if (newEnergy < 20) healthImpact += 0.0007 * deltaTime;
      if (newCleanliness < 30) healthImpact += 0.0006 * deltaTime;
      
      const newHealth = Math.max(0, prev.health - healthImpact);
      
      // Atualizando idade (mais lento)
      const newAge = prev.age + (deltaTime * 0.00001);
      
      // Atualizar disciplina gradualmente ao valor médio se não houver interação
      const newDiscipline = prev.discipline > 50 
        ? Math.max(50, prev.discipline - 0.0001 * deltaTime)
        : Math.min(50, prev.discipline + 0.0001 * deltaTime);
      
      return {
        hunger: newHunger,
        happiness: newHappiness,
        energy: newEnergy,
        health: newHealth,
        age: newAge,
        cleanliness: newCleanliness,
        discipline: newDiscipline
      };
    });
  };
  
  // Atualiza o estágio e humor sempre que as estatísticas mudarem
  useEffect(() => {
    updateStage();
    updateMood();
    
    // Verificar se morreu
    if (stats.health <= 0 && state.isAlive) {
      setState(prev => ({ ...prev, isAlive: false }));
      addEvent("Seu pet faleceu... 😢");
      showToast("Seu pet faleceu... 😢");
      triggerAnimation('fade');
    }
  }, [stats, updateStage, updateMood]);
  
  // Ações do pet
  const feed = () => {
    if (!state.isAlive || state.mood === 'sleeping') return;
    
    setStats(prev => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 30)
    }));
    
    setState(prev => ({ ...prev, lastAction: 'feed' }));
    showToast('Nhom nhom! 🍔');
    addEvent("Você alimentou seu pet!");
    triggerAnimation('bounce');
  };
  
  const play = () => {
    if (!state.isAlive || state.mood === 'sleeping') return;
    
    setStats(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 25),
      energy: Math.max(0, prev.energy - 10),
      hunger: Math.max(0, prev.hunger - 5)
    }));
    
    setState(prev => ({ ...prev, lastAction: 'play' }));
    showToast('Wheee! 🎮');
    addEvent("Você brincou com seu pet!");
    triggerAnimation('bounce');
  };
  
  const sleep = () => {
    if (!state.isAlive) return;
    
    if (state.mood === 'sleeping') {
      // Acordar
      setState(prev => ({ ...prev, mood: 'normal', lastAction: 'wake' }));
      showToast('Bom dia! ☀️');
      addEvent("Seu pet acordou!");
    } else {
      // Dormir
      setState(prev => ({ ...prev, mood: 'sleeping', lastAction: 'sleep' }));
      showToast('Zzz... 💤');
      addEvent("Seu pet foi dormir!");
    }
    
    triggerAnimation('fade');
  };
  
  const clean = () => {
    if (!state.isAlive || state.mood === 'sleeping') return;
    
    setStats(prev => ({
      ...prev,
      cleanliness: Math.min(100, prev.cleanliness + 40),
      happiness: Math.min(100, prev.happiness + 5)
    }));
    
    setState(prev => ({ ...prev, lastAction: 'clean' }));
    showToast('Limpinho! 🧼');
    addEvent("Você limpou seu pet!");
    triggerAnimation('shake');
  };
  
  const discipline = () => {
    if (!state.isAlive || state.mood === 'sleeping') return;
    
    setStats(prev => ({
      ...prev,
      discipline: Math.min(100, prev.discipline + 15),
      happiness: Math.max(0, prev.happiness - 10)
    }));
    
    setState(prev => ({ ...prev, lastAction: 'discipline' }));
    showToast('Comportado! 📏');
    addEvent("Você disciplinou seu pet!");
    triggerAnimation('shake');
  };
  
  const medicine = () => {
    if (!state.isAlive || state.mood === 'sleeping') return;
    
    setStats(prev => ({
      ...prev,
      health: Math.min(100, prev.health + 30)
    }));
    
    setState(prev => ({ ...prev, lastAction: 'medicine' }));
    showToast('Melhorando! 💊');
    addEvent("Você medicou seu pet!");
    triggerAnimation('spin');
  };
  
  // Reiniciar o jogo
  const resetGame = () => {
    setStats({
      hunger: 100,
      happiness: 100,
      energy: 100,
      health: 100,
      age: 0,
      cleanliness: 100,
      discipline: 50,
    });
    
    setState({
      isAlive: true,
      stage: 'egg',
      mood: 'normal',
      isAnimating: false,
      lastAction: '',
      isDayTime: true,
    });
    
    setGameTime({
      lastTick: Date.now(),
      totalTime: 0,
      gameSpeed: 1,
      paused: false,
    });
    
    setEventLog([{time: new Date().toLocaleTimeString(), text: "Novo Tamagotchi nasceu!"}]);
    showToast("Novo Tamagotchi nasceu!");
  };
  
  // Controles de jogo
  const togglePause = () => {
    setGameTime(prev => ({ 
      ...prev, 
      paused: !prev.paused,
      lastTick: Date.now()
    }));
    
    const message = gameTime.paused ? "Jogo continuando!" : "Jogo pausado!";
    addEvent(message);
    showToast(message);
  };
  
  const changeSpeed = (speed) => {
    setGameTime(prev => ({ 
      ...prev, 
      gameSpeed: speed,
      lastTick: Date.now()
    }));
    
    const message = `Velocidade ajustada para ${speed}x!`;
    addEvent(message);
    showToast(message);
  };
  
  // Classes de animação
  let animationClasses = '';
  if (animation.bounce) animationClasses += ' animate-bounce';
  if (animation.shake) animationClasses += ' animate-pulse';
  if (animation.fade) animationClasses += ' animate-fade';
  if (animation.spin) animationClasses += ' animate-spin';
  
  // Determina qual emoji mostrar
  const currentEmoji = emojis[state.stage][state.mood];
  
  // Determina as classes para dia/noite
  const containerClass = state.isDayTime ? 'container day' : 'container night';
  
  return (
    <div className={containerClass}>
      <div className="header">
        <h1>Emoji Tamagotchi</h1>
        <p className="age-info">Idade: {stats.age.toFixed(1)} • {state.stage.charAt(0).toUpperCase() + state.stage.slice(1)}</p>
      </div>
      
      {/* Toast Notification */}
      {toast.visible && (
        <div className="toast-notification">
          {toast.message}
        </div>
      )}
      
      {/* Pet Display */}
      <div className="pet-display">
        <div className={`pet-emoji ${animationClasses}`}>
          {state.isAlive ? currentEmoji : '☠️'}
        </div>
      </div>
      
      {/* Statuses */}
      <div className="stats-grid">
        <div className="stat-item">
          <span>Fome: </span>
          <div className="stat-bar">
            <div 
              className="stat-value hunger"
              style={{width: `${stats.hunger}%`}}
            ></div>
          </div>
        </div>
        <div className="stat-item">
          <span>Felicidade: </span>
          <div className="stat-bar">
            <div 
              className="stat-value happiness"
              style={{width: `${stats.happiness}%`}}
            ></div>
          </div>
        </div>
        <div className="stat-item">
          <span>Energia: </span>
          <div className="stat-bar">
            <div 
              className="stat-value energy"
              style={{width: `${stats.energy}%`}}
            ></div>
          </div>
        </div>
        <div className="stat-item">
          <span>Saúde: </span>
          <div className="stat-bar">
            <div 
              className="stat-value health"
              style={{width: `${stats.health}%`}}
            ></div>
          </div>
        </div>
        <div className="stat-item">
          <span>Limpeza: </span>
          <div className="stat-bar">
            <div 
              className="stat-value cleanliness"
              style={{width: `${stats.cleanliness}%`}}
            ></div>
          </div>
        </div>
        <div className="stat-item">
          <span>Disciplina: </span>
          <div className="stat-bar">
            <div 
              className="stat-value discipline"
              style={{width: `${stats.discipline}%`}}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="actions-grid">
        <button 
          onClick={feed} 
          disabled={!state.isAlive || state.mood === 'sleeping'}
          className="action-button feed"
        >
          🍔 Alimentar
        </button>
        <button 
          onClick={play} 
          disabled={!state.isAlive || state.mood === 'sleeping'}
          className="action-button play"
        >
          🎮 Brincar
        </button>
        <button 
          onClick={sleep} 
          disabled={!state.isAlive}
          className="action-button sleep"
        >
          {state.mood === 'sleeping' ? '☀️ Acordar' : '💤 Dormir'}
        </button>
        <button 
          onClick={clean} 
          disabled={!state.isAlive || state.mood === 'sleeping'}
          className="action-button clean"
        >
          🧼 Limpar
        </button>
        <button 
          onClick={discipline} 
          disabled={!state.isAlive || state.mood === 'sleeping'}
          className="action-button discipline"
        >
          📏 Disciplinar
        </button>
        <button 
          onClick={medicine} 
          disabled={!state.isAlive || state.mood === 'sleeping'}
          className="action-button medicine"
        >
          💊 Medicar
        </button>
      </div>
      
      {/* Game Controls */}
      <div className="game-controls">
        <button 
          onClick={togglePause} 
          className="control-button pause"
        >
          {gameTime.paused ? '▶️ Continuar' : '⏸️ Pausar'}
        </button>
        
        <div className="speed-controls">
          <span>Velocidade:</span>
          <button 
            onClick={() => changeSpeed(0.5)} 
            className={`speed-button ${gameTime.gameSpeed === 0.5 ? 'active' : ''}`}
          >
            0.5x
          </button>
          <button 
            onClick={() => changeSpeed(1)} 
            className={`speed-button ${gameTime.gameSpeed === 1 ? 'active' : ''}`}
          >
            1x
          </button>
          <button 
            onClick={() => changeSpeed(2)} 
            className={`speed-button ${gameTime.gameSpeed === 2 ? 'active' : ''}`}
          >
            2x
          </button>
        </div>
        
        {!state.isAlive && (
          <button 
            onClick={resetGame} 
            className="control-button reset"
          >
            🔄 Reiniciar
          </button>
        )}
      </div>
      
      {/* Event Log */}
      <div className="event-log">
        <h3>Eventos Recentes:</h3>
        <ul>
          {eventLog.map((event, index) => (
            <li key={index}>
              <span className="event-time">[{event.time}]</span> {event.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EmojiTamagotchi;



// import React, { useState, useEffect, useCallback } from 'react';
// import './EmojiTamagotchi.css'; // Import CSS file

// const EmojiTamagotchi = () => {
//   // Estados do Tamagotchi
//   const [stats, setStats] = useState({
//     hunger: 100,
//     happiness: 100,
//     energy: 100,
//     health: 100,
//     age: 0,
//     cleanliness: 100,
//     discipline: 50,
//   });
  
//   const [state, setState] = useState({
//     isAlive: true,
//     stage: 'egg', // egg, baby, child, teen, adult
//     mood: 'normal', // normal, happy, sad, sick, sleeping
//     isAnimating: false,
//     lastAction: '',
//     actionMessage: '',
//     isDayTime: true,
//   });
  
//   const [gameTime, setGameTime] = useState({
//     lastTick: Date.now(),
//     totalTime: 0,
//     gameSpeed: 1, // multiplicador de velocidade
//     paused: false,
//   });
  
//   // Emojis para cada estágio e humor
//   const emojis = {
//     egg: { normal: '🥚', happy: '🥚', sad: '🥚', sick: '🥚', sleeping: '💤🥚' },
//     baby: { normal: '👶', happy: '😊', sad: '😢', sick: '🤒', sleeping: '💤👶' },
//     child: { normal: '🧒', happy: '😄', sad: '😭', sick: '🤢', sleeping: '💤🧒' },
//     teen: { normal: '👦', happy: '😁', sad: '😔', sick: '🤮', sleeping: '💤👦' },
//     adult: { normal: '🧑', happy: '😎', sad: '😫', sick: '🥵', sleeping: '💤🧑' },
//   };
  
//   // Efeitos de animação
//   const [animation, setAnimation] = useState({
//     bounce: false,
//     shake: false,
//     fade: false,
//     spin: false,
//   });
  
//   // Histórico de eventos
//   const [eventLog, setEventLog] = useState([]);
//   const addEvent = (event) => {
//     const timestamp = new Date().toLocaleTimeString();
//     setEventLog(prev => {
//       const newLog = [{time: timestamp, text: event}, ...prev];
//       return newLog.slice(0, 5); // Manter apenas os 5 eventos mais recentes
//     });
//   };

//   // Sistema de progressão de idade/estágio
//   const updateStage = useCallback(() => {
//     const { age } = stats;
//     let newStage = state.stage;
    
//     if (age >= 20) newStage = 'adult';
//     else if (age >= 10) newStage = 'teen';
//     else if (age >= 5) newStage = 'child';
//     else if (age >= 1) newStage = 'baby';
    
//     if (newStage !== state.stage) {
//       setState(prev => ({ ...prev, stage: newStage }));
//       addEvent(`Seu pet evoluiu para o estágio: ${newStage}!`);
//       triggerAnimation('bounce');
//     }
//   }, [stats.age, state.stage]);
  
//   // Sistema de humor
//   const updateMood = useCallback(() => {
//     const { hunger, happiness, energy, health } = stats;
//     let newMood = 'normal';
    
//     if (state.mood === 'sleeping') return; // Não alterar se estiver dormindo
    
//     if (health < 30) {
//       newMood = 'sick';
//     } else if (hunger < 30 || happiness < 30) {
//       newMood = 'sad';
//     } else if (happiness > 80 && energy > 50) {
//       newMood = 'happy';
//     }
    
//     if (newMood !== state.mood) {
//       setState(prev => ({ ...prev, mood: newMood }));
//     }
//   }, [stats, state.mood]);
  
//   // Função de animação
//   const triggerAnimation = (type) => {
//     setAnimation(prev => ({ ...prev, [type]: true }));
//     setTimeout(() => {
//       setAnimation(prev => ({ ...prev, [type]: false }));
//     }, 600);
//   };
  
//   // Game loop principal
//   useEffect(() => {
//     if (state.isAlive && !gameTime.paused) {
//       const gameLoop = setInterval(() => {
//         const currentTime = Date.now();
//         const deltaTime = (currentTime - gameTime.lastTick) * gameTime.gameSpeed;
        
//         setGameTime(prev => ({
//           ...prev,
//           lastTick: currentTime,
//           totalTime: prev.totalTime + deltaTime
//         }));
        
//         // Atualiza o ciclo dia/noite (a cada 5 minutos de tempo de jogo)
//         if (Math.floor(gameTime.totalTime / 300000) !== 
//             Math.floor((gameTime.totalTime + deltaTime) / 300000)) {
//           setState(prev => ({ 
//             ...prev, 
//             isDayTime: !prev.isDayTime 
//           }));
//           addEvent(state.isDayTime ? "Anoiteceu!" : "Amanheceu!");
//         }
        
//         // Atualiza estatísticas
//         updateStats(deltaTime);
//       }, 1000); // Atualiza a cada segundo
      
//       return () => clearInterval(gameLoop);
//     }
//   }, [state.isAlive, gameTime.paused, gameTime.lastTick]);
  
//   // Atualiza estatísticas baseado no tempo
//   const updateStats = (deltaTime) => {
//     setStats(prev => {
//       // Taxa de diminuição base por segundo (ms * fator)
//       const hungerRate = state.mood === 'sleeping' ? 0.0004 : 0.001;
//       const happinessRate = 0.0005;
//       const energyRate = state.mood === 'sleeping' ? -0.001 : 0.0008; // recupera energia dormindo
//       const cleanlinessRate = 0.0003;
      
//       // Calcular novos valores
//       const newHunger = Math.max(0, prev.hunger - hungerRate * deltaTime);
//       const newHappiness = Math.max(0, prev.happiness - happinessRate * deltaTime);
//       const newEnergy = Math.max(0, prev.energy - energyRate * deltaTime);
//       const newCleanliness = Math.max(0, prev.cleanliness - cleanlinessRate * deltaTime);
      
//       // Verificando a saúde baseada nos outros atributos
//       let healthImpact = 0;
//       if (newHunger < 20) healthImpact += 0.001 * deltaTime;
//       if (newHappiness < 20) healthImpact += 0.0005 * deltaTime;
//       if (newEnergy < 20) healthImpact += 0.0007 * deltaTime;
//       if (newCleanliness < 30) healthImpact += 0.0006 * deltaTime;
      
//       const newHealth = Math.max(0, prev.health - healthImpact);
      
//       // Atualizando idade (mais lento)
//       const newAge = prev.age + (deltaTime * 0.00001);
      
//       // Atualizar disciplina gradualmente ao valor médio se não houver interação
//       const newDiscipline = prev.discipline > 50 
//         ? Math.max(50, prev.discipline - 0.0001 * deltaTime)
//         : Math.min(50, prev.discipline + 0.0001 * deltaTime);
      
//       return {
//         hunger: newHunger,
//         happiness: newHappiness,
//         energy: newEnergy,
//         health: newHealth,
//         age: newAge,
//         cleanliness: newCleanliness,
//         discipline: newDiscipline
//       };
//     });
//   };
  
//   // Atualiza o estágio e humor sempre que as estatísticas mudarem
//   useEffect(() => {
//     updateStage();
//     updateMood();
    
//     // Verificar se morreu
//     if (stats.health <= 0 && state.isAlive) {
//       setState(prev => ({ ...prev, isAlive: false }));
//       addEvent("Seu pet faleceu... 😢");
//       triggerAnimation('fade');
//     }
//   }, [stats, updateStage, updateMood]);
  
//   // Função para mostrar mensagem de ação temporária
//   const showActionMessage = (message) => {
//     setState(prev => ({ ...prev, actionMessage: message }));
//     setTimeout(() => {
//       setState(prev => ({ ...prev, actionMessage: '' }));
//     }, 2000);
//   };
  
//   // Ações do pet
//   const feed = () => {
//     if (!state.isAlive || state.mood === 'sleeping') return;
    
//     setStats(prev => ({
//       ...prev,
//       hunger: Math.min(100, prev.hunger + 30)
//     }));
    
//     setState(prev => ({ ...prev, lastAction: 'feed' }));
//     showActionMessage('Nhom nhom! 🍔');
//     addEvent("Você alimentou seu pet!");
//     triggerAnimation('bounce');
//   };
  
//   const play = () => {
//     if (!state.isAlive || state.mood === 'sleeping') return;
    
//     setStats(prev => ({
//       ...prev,
//       happiness: Math.min(100, prev.happiness + 25),
//       energy: Math.max(0, prev.energy - 10),
//       hunger: Math.max(0, prev.hunger - 5)
//     }));
    
//     setState(prev => ({ ...prev, lastAction: 'play' }));
//     showActionMessage('Wheee! 🎮');
//     addEvent("Você brincou com seu pet!");
//     triggerAnimation('bounce');
//   };
  
//   const sleep = () => {
//     if (!state.isAlive) return;
    
//     if (state.mood === 'sleeping') {
//       // Acordar
//       setState(prev => ({ ...prev, mood: 'normal', lastAction: 'wake' }));
//       showActionMessage('Bom dia! ☀️');
//       addEvent("Seu pet acordou!");
//     } else {
//       // Dormir
//       setState(prev => ({ ...prev, mood: 'sleeping', lastAction: 'sleep' }));
//       showActionMessage('Zzz... 💤');
//       addEvent("Seu pet foi dormir!");
//     }
    
//     triggerAnimation('fade');
//   };
  
//   const clean = () => {
//     if (!state.isAlive || state.mood === 'sleeping') return;
    
//     setStats(prev => ({
//       ...prev,
//       cleanliness: Math.min(100, prev.cleanliness + 40),
//       happiness: Math.min(100, prev.happiness + 5)
//     }));
    
//     setState(prev => ({ ...prev, lastAction: 'clean' }));
//     showActionMessage('Limpinho! 🧼');
//     addEvent("Você limpou seu pet!");
//     triggerAnimation('shake');
//   };
  
//   const discipline = () => {
//     if (!state.isAlive || state.mood === 'sleeping') return;
    
//     setStats(prev => ({
//       ...prev,
//       discipline: Math.min(100, prev.discipline + 15),
//       happiness: Math.max(0, prev.happiness - 10)
//     }));
    
//     setState(prev => ({ ...prev, lastAction: 'discipline' }));
//     showActionMessage('Comportado! 📏');
//     addEvent("Você disciplinou seu pet!");
//     triggerAnimation('shake');
//   };
  
//   const medicine = () => {
//     if (!state.isAlive || state.mood === 'sleeping') return;
    
//     setStats(prev => ({
//       ...prev,
//       health: Math.min(100, prev.health + 30)
//     }));
    
//     setState(prev => ({ ...prev, lastAction: 'medicine' }));
//     showActionMessage('Melhorando! 💊');
//     addEvent("Você medicou seu pet!");
//     triggerAnimation('spin');
//   };
  
//   // Reiniciar o jogo
//   const resetGame = () => {
//     setStats({
//       hunger: 100,
//       happiness: 100,
//       energy: 100,
//       health: 100,
//       age: 0,
//       cleanliness: 100,
//       discipline: 50,
//     });
    
//     setState({
//       isAlive: true,
//       stage: 'egg',
//       mood: 'normal',
//       isAnimating: false,
//       lastAction: '',
//       actionMessage: '',
//       isDayTime: true,
//     });
    
//     setGameTime({
//       lastTick: Date.now(),
//       totalTime: 0,
//       gameSpeed: 1,
//       paused: false,
//     });
    
//     setEventLog([{time: new Date().toLocaleTimeString(), text: "Novo Tamagotchi nasceu!"}]);
//   };
  
//   // Controles de jogo
//   const togglePause = () => {
//     setGameTime(prev => ({ 
//       ...prev, 
//       paused: !prev.paused,
//       lastTick: Date.now()
//     }));
    
//     addEvent(gameTime.paused ? "Jogo continuando!" : "Jogo pausado!");
//   };
  
//   const changeSpeed = (speed) => {
//     setGameTime(prev => ({ 
//       ...prev, 
//       gameSpeed: speed,
//       lastTick: Date.now()
//     }));
    
//     addEvent(`Velocidade ajustada para ${speed}x!`);
//   };
  
//   // Classes de animação
//   let animationClasses = '';
//   if (animation.bounce) animationClasses += ' animate-bounce';
//   if (animation.shake) animationClasses += ' animate-pulse';
//   if (animation.fade) animationClasses += ' animate-fade';
//   if (animation.spin) animationClasses += ' animate-spin';
  
//   // Determina qual emoji mostrar
//   const currentEmoji = emojis[state.stage][state.mood];
  
//   // Determina as classes para dia/noite
//   const containerClass = state.isDayTime ? 'container day' : 'container night';
  
//   return (
//     <div className={containerClass}>
//       <div className="header">
//         <h1>Emoji Tamagotchi</h1>
//         <p className="age-info">Idade: {stats.age.toFixed(1)} • {state.stage.charAt(0).toUpperCase() + state.stage.slice(1)}</p>
//       </div>
      
//       {/* Status Message */}
//       {state.actionMessage && (
//         <div className="action-message">
//           {state.actionMessage}
//         </div>
//       )}
      
//       {/* Pet Display */}
//       <div className="pet-display">
//         <div className={`pet-emoji ${animationClasses}`}>
//           {state.isAlive ? currentEmoji : '☠️'}
//         </div>
//       </div>
      
//       {/* Statuses */}
//       <div className="stats-grid">
//         <div className="stat-item">
//           <span>Fome: </span>
//           <div className="stat-bar">
//             <div 
//               className="stat-value hunger"
//               style={{width: `${stats.hunger}%`}}
//             ></div>
//           </div>
//         </div>
//         <div className="stat-item">
//           <span>Felicidade: </span>
//           <div className="stat-bar">
//             <div 
//               className="stat-value happiness"
//               style={{width: `${stats.happiness}%`}}
//             ></div>
//           </div>
//         </div>
//         <div className="stat-item">
//           <span>Energia: </span>
//           <div className="stat-bar">
//             <div 
//               className="stat-value energy"
//               style={{width: `${stats.energy}%`}}
//             ></div>
//           </div>
//         </div>
//         <div className="stat-item">
//           <span>Saúde: </span>
//           <div className="stat-bar">
//             <div 
//               className="stat-value health"
//               style={{width: `${stats.health}%`}}
//             ></div>
//           </div>
//         </div>
//         <div className="stat-item">
//           <span>Limpeza: </span>
//           <div className="stat-bar">
//             <div 
//               className="stat-value cleanliness"
//               style={{width: `${stats.cleanliness}%`}}
//             ></div>
//           </div>
//         </div>
//         <div className="stat-item">
//           <span>Disciplina: </span>
//           <div className="stat-bar">
//             <div 
//               className="stat-value discipline"
//               style={{width: `${stats.discipline}%`}}
//             ></div>
//           </div>
//         </div>
//       </div>
      
//       {/* Actions */}
//       <div className="actions-grid">
//         <button 
//           onClick={feed} 
//           disabled={!state.isAlive || state.mood === 'sleeping'}
//           className="action-button feed"
//         >
//           🍔 Alimentar
//         </button>
//         <button 
//           onClick={play} 
//           disabled={!state.isAlive || state.mood === 'sleeping'}
//           className="action-button play"
//         >
//           🎮 Brincar
//         </button>
//         <button 
//           onClick={sleep} 
//           disabled={!state.isAlive}
//           className="action-button sleep"
//         >
//           {state.mood === 'sleeping' ? '☀️ Acordar' : '💤 Dormir'}
//         </button>
//         <button 
//           onClick={clean} 
//           disabled={!state.isAlive || state.mood === 'sleeping'}
//           className="action-button clean"
//         >
//           🧼 Limpar
//         </button>
//         <button 
//           onClick={discipline} 
//           disabled={!state.isAlive || state.mood === 'sleeping'}
//           className="action-button discipline"
//         >
//           📏 Disciplinar
//         </button>
//         <button 
//           onClick={medicine} 
//           disabled={!state.isAlive || state.mood === 'sleeping'}
//           className="action-button medicine"
//         >
//           💊 Medicar
//         </button>
//       </div>
      
//       {/* Game Controls */}
//       <div className="game-controls">
//         <button 
//           onClick={togglePause} 
//           className="control-button pause"
//         >
//           {gameTime.paused ? '▶️ Continuar' : '⏸️ Pausar'}
//         </button>
        
//         <div className="speed-controls">
//           <span>Velocidade:</span>
//           <button 
//             onClick={() => changeSpeed(0.5)} 
//             className={`speed-button ${gameTime.gameSpeed === 0.5 ? 'active' : ''}`}
//           >
//             0.5x
//           </button>
//           <button 
//             onClick={() => changeSpeed(1)} 
//             className={`speed-button ${gameTime.gameSpeed === 1 ? 'active' : ''}`}
//           >
//             1x
//           </button>
//           <button 
//             onClick={() => changeSpeed(2)} 
//             className={`speed-button ${gameTime.gameSpeed === 2 ? 'active' : ''}`}
//           >
//             2x
//           </button>
//         </div>
        
//         {!state.isAlive && (
//           <button 
//             onClick={resetGame} 
//             className="control-button reset"
//           >
//             🔄 Reiniciar
//           </button>
//         )}
//       </div>
      
//       {/* Event Log */}
//       <div className="event-log">
//         <h3>Eventos Recentes:</h3>
//         <ul>
//           {eventLog.map((event, index) => (
//             <li key={index}>
//               <span className="event-time">[{event.time}]</span> {event.text}
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default EmojiTamagotchi;