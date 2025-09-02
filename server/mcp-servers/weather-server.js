#!/usr/bin/env node

/**
 * Weather MCP Server
 * Provides weather information using OpenWeatherMap API
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class WeatherMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'weather-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_current_weather',
            description: 'Get the current weather for a specific location',
            inputSchema: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and country, e.g. "London, UK" or "New York, US"',
                },
                units: {
                  type: 'string',
                  enum: ['metric', 'imperial', 'kelvin'],
                  description: 'Temperature units (metric=Celsius, imperial=Fahrenheit, kelvin=Kelvin)',
                  default: 'metric',
                },
              },
              required: ['location'],
            },
          },
          {
            name: 'get_weather_forecast',
            description: 'Get weather forecast for a specific location',
            inputSchema: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and country, e.g. "London, UK" or "New York, US"',
                },
                days: {
                  type: 'number',
                  description: 'Number of days for forecast (1-5)',
                  default: 3,
                  minimum: 1,
                  maximum: 5,
                },
                units: {
                  type: 'string',
                  enum: ['metric', 'imperial', 'kelvin'],
                  description: 'Temperature units (metric=Celsius, imperial=Fahrenheit, kelvin=Kelvin)',
                  default: 'metric',
                },
              },
              required: ['location'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_current_weather':
            return await this.getCurrentWeather(args);
          case 'get_weather_forecast':
            return await this.getWeatherForecast(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async getCurrentWeather(args) {
    const { location, units = 'metric' } = args;
    
    // For demo purposes, we'll return mock weather data
    // In a real implementation, you would call OpenWeatherMap API
    const mockWeatherData = {
      location: location,
      temperature: units === 'metric' ? '22°C' : units === 'imperial' ? '72°F' : '295K',
      description: 'Partly cloudy',
      humidity: '65%',
      wind_speed: units === 'metric' ? '12 km/h' : '7 mph',
      pressure: '1013 hPa',
      visibility: '10 km',
      uv_index: '6',
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Current weather for ${location}:
🌡️ Temperature: ${mockWeatherData.temperature}
☁️ Conditions: ${mockWeatherData.description}
💧 Humidity: ${mockWeatherData.humidity}
💨 Wind: ${mockWeatherData.wind_speed}
📊 Pressure: ${mockWeatherData.pressure}
👁️ Visibility: ${mockWeatherData.visibility}
☀️ UV Index: ${mockWeatherData.uv_index}
🕐 Updated: ${new Date(mockWeatherData.timestamp).toLocaleString()}`,
        },
      ],
    };
  }

  async getWeatherForecast(args) {
    const { location, days = 3, units = 'metric' } = args;
    
    // Mock forecast data
    const forecast = [];
    const conditions = ['Sunny', 'Partly cloudy', 'Cloudy', 'Light rain', 'Heavy rain'];
    const tempBase = units === 'metric' ? 20 : units === 'imperial' ? 68 : 293;
    
    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const temp = tempBase + Math.floor(Math.random() * 10) - 5;
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      forecast.push({
        date: date.toDateString(),
        temperature: units === 'metric' ? `${temp}°C` : units === 'imperial' ? `${temp}°F` : `${temp}K`,
        condition: condition,
        high: units === 'metric' ? `${temp + 3}°C` : units === 'imperial' ? `${temp + 5}°F` : `${temp + 3}K`,
        low: units === 'metric' ? `${temp - 3}°C` : units === 'imperial' ? `${temp - 5}°F` : `${temp - 3}K`,
      });
    }

    let forecastText = `Weather forecast for ${location} (${days} days):\n\n`;
    forecast.forEach((day, index) => {
      forecastText += `${day.date}:\n`;
      forecastText += `  🌡️ ${day.temperature} (High: ${day.high}, Low: ${day.low})\n`;
      forecastText += `  ☁️ ${day.condition}\n\n`;
    });

    return {
      content: [
        {
          type: 'text',
          text: forecastText,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Weather MCP server running on stdio');
  }
}

// Start the server
const server = new WeatherMCPServer();
server.run().catch(console.error);
