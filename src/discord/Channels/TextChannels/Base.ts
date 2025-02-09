import type {
	APITextBasedChannel,
	Snowflake,
	TextChannelType,
} from '@discord/types';

import { Channel } from '../Base';
import type { MixChannel } from '../Utils';


class TextBasedChannel<ChannelType extends TextChannelType> extends Channel<ChannelType> {
	public lastMessageId?: Snowflake;
	public type: ChannelType;
  
	public constructor(
		client: LunaryClient,
		data: MixChannel<ChannelType, APITextBasedChannel<ChannelType>>
	) {
		super(client, data);
  
		this.type = data.type;

		// @ts-ignore
		this.lastMessageId = data.last_message_id ?? undefined;
	}
}

export { TextBasedChannel };