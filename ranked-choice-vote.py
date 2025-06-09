import functools
from typing import List, Dict, Any, Union

class RankedChoiceVote:
    """
    Ranked Choice Voting by Seamus Campbell (seamus@seamuscampbell.nyc) with assistance from ChatGPT and CodeConvert (for translating from PHP)
    
    Algorithm methodology:
        Put all candidates into a 2-dimensional array with the first dimension being the individual ballot and the second dimension being the order
        After each round, see who has the most votes at the front of their rankings
        If a candidate passes the win number (simple majority), remove them from contention
        If the number of spots for winning candidates is full, stop
        Otherwise, order the rankings and find the candidate with the fewest number of votes BUT if there is a "protected candidate" (e.g. "No Endorsement"), find the candidate with the second-fewest votes
        Remove the found candidate from all of the ballots (i.e. every candidate goes up one rank)
        Continue the process until the number of winners or number of remaining candidates equals the number of maximum winners
    """
    
    def __init__(self, votes: List[List[str]], protected_candidate: str, election_name: str, num_of_winners: int):
        """
        Constructor function
        return: void
        arguments: array (2 dimensional), string, string, int
        """
        if not isinstance(votes, list):
            raise Exception(f"Parameter 1 (votes array) is not of type array; {type(votes).__name__} given")
        if not isinstance(protected_candidate, str):
            raise Exception(f"Parameter 2 (protected candidate) is not of type string; {type(protected_candidate).__name__} given")
        if not isinstance(election_name, str):
            raise Exception(f"Parameter 3 (election name) is not of type string; {type(election_name).__name__} given")
        if not isinstance(num_of_winners, int):
            raise Exception(f"Parameter 4 (number of winners) is not of type integer; {type(num_of_winners).__name__} given")
            
        self._votes = votes  # input multidimensional array of all of the votes (2-dimensional array)
        self._protected_candidate = protected_candidate  # if there is a candidate that must be saved round to round, this is where to save it (string)
        self._rounds = 1  # counter for the number of rounds it has taken to run (int)
        self._election_name = election_name  # name of office being sought (string)
        self._num_of_winners = num_of_winners  # number of people that can be elected (int)
        self._winner_exists = False  # boolean for if a winner has been found (bool)
        self._winner_name = []  # array storing the name(s) of the winner(s) (1-dimensional array)
        self._num_of_spots_to_fill = num_of_winners  # number of remaining spots (int)
    
    def get_winner_exists(self) -> bool:
        """
        Function for telling if there is a winner
        return: bool
        arguments: none
        """
        return self._winner_exists
    
    def get_election_name(self) -> str:
        """
        Function to get the office being sought
        return: string
        arguments: none
        """
        return self._election_name
    
    def get_num_of_winners(self) -> int:
        """
        Function to get the number of winners
        return: int
        arguments: none
        """
        return self._num_of_winners
    
    def get_winner(self) -> List[str]:
        """
        Function for outputting the winner list
        return: array
        arguments: none
        """
        return self._winner_name
    
    def get_number_of_confirmed_winners(self) -> int:
        """
        Function to output the number of winners in the list
        return: int
        arguments: none
        """
        return len(self.get_winner())
    
    def get_candidate_list(self, array: List[Any]) -> List[str]:
        """
        Function for outputting a list of all of the candidates
        return: array
        arguments: array
        """
        unique_values = []
        for value in array:
            if isinstance(value, list):
                # If the element is an array, recursively call the function
                unique_values.extend(self.get_candidate_list(value))
            elif value not in unique_values:
                # If the element is not already in the unique values array, add it
                unique_values.append(value)
        return unique_values
    
    def _remove_blank_arrays(self, array: List[List[str]]) -> None:
        """
        Function to remove spoiled ballots
        return: void
        arguments: array
        """
        temp_array = [sub_array for sub_array in array if sub_array]
        self._votes = temp_array
    
    def _get_num_of_ballots(self) -> int:
        """
        Function for getting the number of people who voted
        return: int
        arguments: none
        """
        return len(self._votes)
    
    def _is_even(self, number: int) -> bool:
        """
        Function to help determine win number
        return: bool
        arguments: int
        """
        if number % 2 == 0:
            return True
        else:
            return False
    
    def get_win_number(self) -> int:
        """
        Function for getting the win number (simple majority)
        return: int
        arguments: none
        """
        num_of_ballots = self._get_num_of_ballots()
        win_number = 0
        if self._is_even(num_of_ballots):
            win_number = num_of_ballots // 2
            win_number += 1
        else:
            num_of_ballots += 1
            win_number = num_of_ballots // 2
        return win_number
    
    def _get_candidate_with_fewest(self, array: List[List[str]], skip: str) -> str:
        """
        Function to search through the first item in each ballot (ballot = 1st dimension of the array) and find the person who got the fewest votes
        return: string
        arguments: array (2 dimensional), string
        """
        vote_count = {}
        first_column = self._get_first_item_in_each_dimension(array)
        for candidate in first_column:
            if candidate not in vote_count:
                vote_count[candidate] = 1
            else:
                vote_count[candidate] += 1
        
        # Sort by value (ascending)
        sorted_vote_count = dict(sorted(vote_count.items(), key=lambda x: x[1]))
        print(self._print_tally(sorted_vote_count), end='')
        
        # Reverse to get descending order, then get the last key (fewest votes)
        reversed_vote_count = dict(reversed(list(sorted_vote_count.items())))
        fewest = list(reversed_vote_count.keys())[-1]
        
        if fewest == skip:  # if candidate cannot be removed, get next lowest
            fewest = self._get_key_of_second_to_last_item(reversed_vote_count)
        return fewest
    
    def _get_candidate_with_most(self, array: List[List[str]]) -> str:
        """
        Function to search through the first item in each ballot (ballot = 1st dimension of the array) and find the person who got the most votes
        return: string
        arguments: array (2 dimensional)
        """
        vote_count = {}
        first_column = self._get_first_item_in_each_dimension(array)
        for candidate in first_column:
            if candidate not in vote_count:
                vote_count[candidate] = 1
            else:
                vote_count[candidate] += 1
        
        # Sort by value (ascending) then reverse to get descending order
        sorted_vote_count = dict(sorted(vote_count.items(), key=lambda x: x[1]))
        reversed_vote_count = dict(reversed(list(sorted_vote_count.items())))
        most = next(iter(reversed_vote_count))
        return most
    
    def _get_num_of_candidates_in_round(self, array: List[List[str]]) -> int:
        """
        Function to see if there are two candidates running in this round
        return: int
        arguments: array (2 dimensional)
        """
        vote_count = {}
        first_column = self._get_first_item_in_each_dimension(array)
        for candidate in first_column:
            if candidate not in vote_count:
                vote_count[candidate] = 1
            else:
                vote_count[candidate] += 1
        
        num_of_candidates = len(vote_count)
        return num_of_candidates
    
    def _get_key_of_second_to_last_item(self, array: Dict[str, int]) -> str:
        """
        If there is a candidate that cannot be removed, get the candidate with the second-fewest number of votes
        return: string
        arguments: array (1 dimensional)
        """
        keys = list(array.keys())
        if len(keys) >= 2:
            second_to_last_key = keys[len(keys) - 2]
            return second_to_last_key
        else:
            return None  # Return null if there are fewer than two elements in the array.
    
    def _print_tally(self, array: Dict[str, int]) -> str:
        """
        Function for seeing how many votes each person got in that round
        return: void
        arguments: array (1 dimensional)
        """
        reversed_array = dict(reversed(list(array.items())))
        output = ""
        for key, value in reversed_array.items():
            output += f"{key}: {value} votes<br />\r\n"
        return output
    
    def _remove_candidate(self, array: List[Any], search: str) -> None:
        """
        Function to remove the person from the entire array
        return: void
        arguments: array (2 dimensional), string
        """
        i = 0
        while i < len(array):
            if isinstance(array[i], list):
                self._remove_candidate(array[i], search)
                i += 1
            elif isinstance(array[i], str) and search in array[i]:
                del array[i]
            else:
                i += 1
        
        # Rebuild array with sequential indices (equivalent to array_values)
        array[:] = [item for item in array if item]
    
    def _get_first_item_in_each_dimension(self, array: List[List[str]]) -> List[str]:
        """
        Function for getting the first item in the first dimension of each element of the array (i.e. the list of candidates from that round)
        return: array (1 dimensional)
        arguments: array (2 dimensional)
        """
        first_items = []
        for sub_array in array:
            if isinstance(sub_array, list) and len(sub_array) > 0:
                first_items.append(sub_array[0])
        return first_items
    
    def _add_winner(self, winner: str) -> None:
        """
        Function for adding a winner to the winner array
        return: void
        arguments: string
        """
        self._winner_name.append(winner)
    
    def _find_unique_votes_left(self) -> List[str]:
        """
        Function to get the list of candidates left (basically the same as getCandidateList() but private)
        return: array
        arguments: none
        """
        flattened_array = functools.reduce(lambda x, y: x + y, self._votes, [])
        unique_items = list(set(flattened_array))
        return unique_items
    
    def _find_num_of_unique_votes_left(self) -> int:
        """
        Function to get number of candidates left in the race
        return: int
        arguments: none
        """
        unique_items = self._find_unique_votes_left()
        array_len = len(unique_items)
        return array_len
    
    def _get_number_of_spots_to_fill(self) -> int:
        """
        Function to get the number of spots left
        return: int
        arguments: none
        """
        return self._num_of_spots_to_fill
    
    def _reduce_number_of_remaining_spots_by_one(self) -> None:
        """
        Function to reduce the number of spots left by 1
        return: void
        arguments: none
        """
        self._num_of_spots_to_fill -= 1
    
    def _final_candidates_round(self, array: List[List[str]]) -> str:
        """
        Function for if we are in the last round before figuring out who won
        return: string
        arguments: array (2 dimensional)
        """
        vote_count = {}
        first_column = self._get_first_item_in_each_dimension(array)
        for candidate in first_column:
            if candidate not in vote_count:
                vote_count[candidate] = 1
            else:
                vote_count[candidate] += 1
        
        # Sort by value (ascending) then reverse to get descending order
        sorted_vote_count = dict(sorted(vote_count.items(), key=lambda x: x[1]))
        reversed_vote_count = dict(reversed(list(sorted_vote_count.items())))
        
        for key, value in reversed_vote_count.items():
            print(f"{key}: {value} votes<br />\r\n", end='')
        
        fewest = list(reversed_vote_count.keys())[-1]
        return fewest
    
    def _conduct_round(self) -> None:
        """
        Function for determining who got the fewest votes and removing them from all ballots; if only two are competing in the round, remove the lowest
        return: void
        arguments: none
        """
        if self._get_num_of_candidates_in_round(self._votes) == 2:
            candidate_to_remove = self._get_candidate_with_fewest(self._votes, "Name of a candidate that does not exist")
            candidate_that_won_round = self._get_candidate_with_most(self._votes)
            self._add_winner(candidate_that_won_round)
            self._reduce_number_of_remaining_spots_by_one()
            print(f"{candidate_to_remove} was eliminated<br />\r\n", end='')
            print(f"{candidate_that_won_round} won round<br />\r\n\r\n", end='')
        else:
            candidate_to_remove = self._get_candidate_with_fewest(self._votes, self._protected_candidate)
            print(f"{candidate_to_remove} was eliminated<br />\r\n\r\n", end='')
        
        self._remove_candidate(self._votes, candidate_to_remove)
    
    def _increase_round(self) -> None:
        """
        Function to increment the number of rounds
        return: void
        arguments: none
        """
        self._rounds += 1
    
    def _num_of_candidates_left(self) -> int:
        """
        Function for getting number of candidates that have yet to be eliminated
        return: int
        arguments: none
        """
        candidate_list = self._find_unique_votes_left()
        return len(candidate_list)
    
    def _see_if_top_vote_getter_is_over_win_num(self, array: List[List[str]]) -> List[str]:
        """
        Function to see if the top vote-getter is over the threshold of votes; if so, remove them from the list
        return: array
        arguments: array (2 dimensional)
        """
        return_array = []
        vote_count = {}
        first_column = self._get_first_item_in_each_dimension(array)
        for candidate in first_column:
            if candidate not in vote_count:
                vote_count[candidate] = 1
            else:
                vote_count[candidate] += 1
        
        # Sort by value (ascending) then reverse to get descending order
        sorted_vote_count = dict(sorted(vote_count.items(), key=lambda x: x[1]))
        reversed_vote_count = dict(reversed(list(sorted_vote_count.items())))
        
        vote_count_output = ""
        for key, value in reversed_vote_count.items():
            vote_count_output += f"{key}: {value} votes<br />\r\n"
            if value >= self.get_win_number():
                return_array.append(key)
        
        if len(return_array) > 0:
            print(vote_count_output, end='')
        
        return return_array
    
    def _protected_candidate_in_last_at_end(self, array: List[List[str]]) -> bool:
        """
        Function to handle situation where, in the end, the protected candidate is in last place
        return: bool
        arguments: array
        """
        # Only use this function in the edge case since it happens only when there are 2 or more winners
        if (self._num_of_candidates_left() == self._get_number_of_spots_to_fill() + 1) and self._num_of_winners > 1:
            # do a dummy round and see who came in last
            vote_count = {}
            first_column = self._get_first_item_in_each_dimension(array)
            for candidate in first_column:
                if candidate not in vote_count:
                    vote_count[candidate] = 1
                else:
                    vote_count[candidate] += 1
            
            # Sort by value (ascending) then reverse to get descending order
            sorted_vote_count = dict(sorted(vote_count.items(), key=lambda x: x[1]))
            reversed_vote_count = dict(reversed(list(sorted_vote_count.items())))
            
            for key, value in reversed_vote_count.items():
                print(f"{key}: {value} votes<br />\r\n", end='')
            
            fewest = list(reversed_vote_count.keys())[-1]
            
            # the protected candidate is the one in last, that's the one to remove
            if fewest == self._protected_candidate:
                return True
            else:
                return False
        else:
            return False
    
    def conduct_election(self) -> None:
        """
        Function for conducting the election
        return: void
        arguments: none
        """
        print(f"<h2>{self._election_name}</h2>\r\n", end='')
        print(f"<h2>Number of winners: {self.get_num_of_winners()}</h2>\r\n", end='')
        print(f"<h2>Win Number: {self.get_win_number()}</h2>\r\n\r\n", end='')
        
        while self._get_number_of_spots_to_fill() > 0:
            print(f"<h3>Round {self._rounds}</h3>\r\n", end='')
            print(f"Number of candidates left: {self._find_num_of_unique_votes_left()}<br />\r\n", end='')
            candidate_over_threshold = self._see_if_top_vote_getter_is_over_win_num(self._votes)
            
            # if a candidate is over the win number, remove from the list
            if len(candidate_over_threshold) > 0:
                for i in range(len(candidate_over_threshold)):
                    self._add_winner(candidate_over_threshold[i])
                    self._remove_candidate(self._votes, candidate_over_threshold[i])
                    self._reduce_number_of_remaining_spots_by_one()
                    print(f"{candidate_over_threshold[i]} has passed the threshold of {self.get_win_number()} votes and will be removed from contention<br />\r\n", end='')
                    print(f"Spots remaining: {self._get_number_of_spots_to_fill()}<br />\r\n\r\n", end='')
            
            # handle special case where the protected candidate is in last
            elif self._protected_candidate_in_last_at_end(self._votes):
                print(f"{self._protected_candidate} is in last place and will be removed from contention<br />\r\n\r\n", end='')
                self._remove_candidate(self._votes, self._protected_candidate)
            
            # if we're down to the final candidates, find the one with the higher of the two
            elif self._num_of_candidates_left() - 1 == self._get_number_of_spots_to_fill():
                winner = self._final_candidates_round(self._votes)
                self._add_winner(winner)
                self._remove_candidate(self._votes, winner)
                self._reduce_number_of_remaining_spots_by_one()
                print(f"{winner} wins last round and is a winner<br />\r\n", end='')
            else:
                self._conduct_round()
            
            self._remove_blank_arrays(self._votes)
            self._increase_round()
        
        if self._get_number_of_spots_to_fill() == 0:
            self._winner_exists = True
            winner_list = self.get_winner()
            if len(winner_list) == 1:
                print(f"<p><strong>{winner_list[0]} is elected as {self.get_election_name()}</strong></p>\r\n", end='')
            else:
                print("<p><strong>", end='')
                for x in range(len(winner_list)):
                    if x == len(winner_list) - 1:
                        print(winner_list[x], end='')
                    else:
                        print(f"{winner_list[x]}, ", end='')
                print(f" are elected as {self.get_election_name()}</strong></p>", end='')

