import { VK } from 'vk-io';

export default function initDefaultSteps(installer) {
  installer.add({
    text: 'Укажите токен вашего сообщества с полным доступом:',
    mute: true,
    handler: async (self, resp) => {
      const vk = new VK({ token: resp });
      try {
        const [group] = await vk.api.groups.getById({});
        const privateConfig = await self.getSettings('private.json');
        self.check(privateConfig, 'vk');
        privateConfig.vk.token = resp;

        const publicConfig = await self.getSettings('config.json');
        self.check(publicConfig, 'vk');
        publicConfig.vk.groupId = group.id;

        return [false, `Группа: ${group.name}`];
			} catch (error) {
				return [true, 'Вы ввели невалидный токен.'];
      }
    }
  });
} 