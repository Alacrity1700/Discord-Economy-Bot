const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = '-';
const DAILY_REWARD_AMOUNT = 1500;
const WORK_REWARD_AMOUNT = 500; 
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; 
const WORK_COOLDOWN = 30 * 60 * 1000; 
const BET_MAX_MULTIPLIER = 2.5;
const BET_MIN_MULTIPLIER = 2.0;
const economy = new Map();
const lastClaimed = new Map();
const lastWorked = new Map();




function getRandomMultiplier() {
    return Math.random() * (BET_MAX_MULTIPLIER - BET_MIN_MULTIPLIER) + BET_MIN_MULTIPLIER;
  }

function getUserData(userId) {
  return economy.get(userId) || { balance: 0, bankBalance: 0 };
}

// Start of the bot
client.on('ready', () => {
  console.log(`${client.user.tag} has logged in.`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const userID = message.author.id;

  // Check if the user has an entry in the economy map
  if (!economy.has(userID)) {
    // If not, initialize with default values
    economy.set(userID, {
      balance: 0,
      bankBalance: 0,
    });
  }



  
  const [command, ...args] = message.content.trim().substring(PREFIX.length).split(/\s+/);


    if (command === 'help') {
        const helpEmbed = new EmbedBuilder()
        .setColor('#7289da')
        .setTitle('Economy Bot Commands')

         .addFields([
          { 
            name: 'General Commands', 
            value: '`-daily` - Claim your daily reward\n`-balance` - Check your balance\n`-deposit <amount>` - Deposit coins into your bank\n`-withdraw <amount>` - Withdraw coins from your bank\n`-work` - Earn coins by working'
          },
          {
            name: 'Betting Commands', 
            value: '`-blackjack` - Start a game of Blackjack\n`-hit` - Draw a card in Blackjack\n`-stand` - End your turn in Blackjack\n`-bet <amount>` - Bet coins with a chance to win' 
          },
        ])

       // .setFooter('Economy Bot by Ivan(Alacrity1700)');

        message.reply({ embeds: [helpEmbed] });
        return;
    }


    if (command === 'work') {
        const lastWorkedTime = lastWorked.get(message.author.id) || 0;
        const now = Date.now();

        if (now - lastWorkedTime < WORK_COOLDOWN) {
          const remainingTime = formatTime(WORK_COOLDOWN - (now - lastWorkedTime));

          const workCooldownEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`You can work again in ${remainingTime}.`);

          message.reply({ embeds: [workCooldownEmbed] });
        } else {
          const userData = getUserData(message.author.id);
          userData.balance += WORK_REWARD_AMOUNT;
          lastWorked.set(message.author.id, now);

          const workRewardEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`You worked hard and earned ${WORK_REWARD_AMOUNT} economy points!`);

          message.reply({ embeds: [workRewardEmbed] });
        }
      }

    if (command === 'daily') {
    const lastClaimedTime = lastClaimed.get(message.author.id) || 0;
    const now = Date.now();

    if (now - lastClaimedTime < DAILY_COOLDOWN) {
      const cooldownEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('You have already claimed your daily reward. Please wait until tomorrow.');

      message.reply({ embeds: [cooldownEmbed] });
    } else {
      const userData = getUserData(message.author.id);
      userData.balance += DAILY_REWARD_AMOUNT;
      lastClaimed.set(message.author.id, now);

      const dailyRewardEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setDescription(`You have claimed your daily reward of ${DAILY_REWARD_AMOUNT} coins!`);

      message.reply({ embeds: [dailyRewardEmbed] });
    }
  }

  if (command === 'balance') {
    const userData = getUserData(userID);

    const balanceEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${message.author.username}'s Balance`)
      .addFields([
        {
          name: 'Wallet Balance',
          value: `${userData?.balance}`,
        },
        {
          name: 'Bank Balance',
          value: `${userData?.bankBalance}`,
        },
      ]);

    message.reply({ embeds: [balanceEmbed] });
  }

  if (command === 'deposit') {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      const invalidAmountEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('Please provide a valid amount to deposit.');

      message.reply({ embeds: [invalidAmountEmbed] });
      return;
    }

    const userData = getUserData(message.author.id);

    if (userData.balance < amount) {
      const insufficientBalanceEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription('You do not have enough coins to deposit.');

      message.reply({ embeds: [insufficientBalanceEmbed] });
      return;
    }

    const currentBankBalance = userData.bankBalance || 0;
    economy.set(message.author.id, {
      balance: userData.balance - amount,
      bankBalance: currentBankBalance + amount,
    });

    const depositEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setDescription(`You have deposited ${amount} coins into your bank account.`);

    message.reply({ embeds: [depositEmbed] });
  }
if (command === 'withdraw') {
  const amount = parseInt(args[0]);
  if (isNaN(amount) || amount <= 0) {
    const invalidAmountEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setDescription('Please provide a valid amount to withdraw.');

    message.reply({ embeds: [invalidAmountEmbed] });
    return;
  }

  const userData = getUserData(message.author.id);
  if (userData.bankBalance < amount) {
    const insufficientBalanceEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setDescription('You do not have enough coins in your bank account.');

    message.reply({ embeds: [insufficientBalanceEmbed] });
    return;
  }

  economy.set(message.author.id, {
    balance: userData.balance + amount,
    bankBalance: userData.bankBalance - amount,
  });

  const withdrawEmbed = new EmbedBuilder()
    .setColor('#00ff00')
    .setDescription(`You have withdrawn ${amount} coins from your bank account.`);

  message.reply({ embeds: [withdrawEmbed] });
}


    //betting system
    if (command === 'bet') {
        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount <= 0) {
          const invalidBetEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('Please provide a valid amount to bet.');

          message.reply({ embeds: [invalidBetEmbed] });
          return;
        }

        const userData = getUserData(message.author.id);

        if (userData.balance < amount) {
          const insufficientBalanceEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('You do not have enough coins to bet.');

          message.reply({ embeds: [insufficientBalanceEmbed] });
          return;
        }

        const winChance = Math.random() < 0.5;
        const multiplier = winChance ? getRandomMultiplier() : 0;

        if (winChance) {
          userData.balance += Math.floor(amount * multiplier);

          const winEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`Congratulations! You won ${Math.floor(amount * multiplier)} coins!`);

          message.reply({ embeds: [winEmbed] });
        } else {
          userData.balance -= amount;

          const loseEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription(`Sorry, you lost ${amount} coins. Better luck next time!`);

          message.reply({ embeds: [loseEmbed] });
        }
    }





  // Additional economy commands can be added here
});

client.login('YOUR_TOKEN_HERE');