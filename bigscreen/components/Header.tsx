import React from 'react';

interface HeaderProps {
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
}

const Header: React.FC<HeaderProps> = ({ connectionStatus = 'disconnected' }) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
        return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'disconnected':
        return '离线';
    }
  };

  return (
    <header className="text-center flex-shrink-0 mb-2 flex items-center justify-between">
      <div className="flex-1" />
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter flex-1">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          星途成长方舟
        </span>
      </h1>
      <div className="flex-1 flex justify-end items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <span className="text-xs text-gray-400">{getStatusText()}</span>
      </div>
    </header>
  );
};

export default Header;
